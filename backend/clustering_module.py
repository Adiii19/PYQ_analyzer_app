import re
import json
import nltk
from pdf2image import convert_from_bytes
from google import genai
from nltk.corpus import stopwords
from pdf2image import convert_from_bytes
import pytesseract
from google.genai import types
from google import genai
from sentence_transformers import SentenceTransformer, util
from collections import defaultdict
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import pandas as pd
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print("Your Gemini API Key:", api_key)


# --- INITIALIZATIONS ---
client = genai.Client(api_key)
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# --- FUNCTION DEFINITIONS ---

def extract_questions_from_pdf(pdf_file):
    """
    Extracts text from a PDF using a local Tesseract OCR engine.
    """
    print("Processing file with local Tesseract OCR engine...")
    
    # FOR WINDOWS USERS: You may need to provide the exact path to your Tesseract installation
    # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
    text = ""
    pdf_bytes = pdf_file.read()

    try:
        # 1. Convert PDF pages to high-resolution images
        images = convert_from_bytes(pdf_bytes, dpi=300)
        
        # This configuration is the best general-purpose mode for layout analysis
        custom_config = r'--oem 3 --psm 3'

        for pil_image in images:
            # 2. Perform OCR directly on the image without OpenCV pre-processing
            text += pytesseract.image_to_string(pil_image, config=custom_config) + "\n"

    except Exception as e:
        print(f"Error during local OCR processing: {e}")
        return []

    # 3. The rest of the logic (sending text to Gemini) remains the same
    prompt = f"""From the text provided, extract all academic questions. Your output MUST be a valid JSON object containing a single key "questions", which is an array of strings.

    **CRITICAL INSTRUCTIONS FOR QUESTION FORMATION:**
    1.  **Identify Question and Options:** A question consists of the main question text followed by its multiple-choice options (e.g., A, B, C, D).
    2.  **Combine and Format:** Combine the question and all its options into a single string. Use a double newline (`\\n\\n`) to separate the question text from the first option. Use a single newline (`\\n`) between each subsequent option.
    3.  **Example of a single question string:** "The price of commodity X increases by 40 paise every year... more than the commodity Y?\\n\\nA. 2010\\nB. 2011\\nC. 2012\\nD. 2013"
    4.  **EXCLUDE Answer and Explanation:** You MUST completely exclude the "Answer:" and "Explanation:" sections from the output string. This is very important.
    5.  **Ignore Metadata:** Exclude any page headers like "Question Bank" or page numbers.

    TEXT:
    {text}
    """
    
    gemini_response = genai.Client().models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=0)
        )
    )
    
    try:
        response_text = gemini_response.text.strip()
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        clean_json_str = response_text[json_start:json_end]
        data = json.loads(clean_json_str)
        questions = data.get("questions", [])
        return [str(q) for q in questions if q]
    except Exception as e:
        print(f"Error parsing JSON from AI response: {e}")
        return []




# ... (The rest of your functions: preprocess_questions, group_similar_questions, etc., remain the same) ...
def preprocess_questions(questions):
    processed = []
    common_phrases = [
        "enlist and explain", "with a neat diagram explain", "explain the working of",
        "differentiate between", "compare", "define", "describe", "elaborate",
        "explain", "enlist", "what is", "what are", "why is", "how does", "can you explain"
    ]
    for q in questions:
        q_lower = q.lower()
        q_lower = re.sub(r'^\s*(q\.\d+\)?\s*[a-z]?\)|[a-z]\)|\d+\.\s*)\s*', '', q_lower).strip()
        for phrase in common_phrases:
            if q_lower.startswith(phrase):
                q_lower = q_lower[len(phrase):].strip()
                break
        q_lower = re.sub(r'\(.*?\)', '', q_lower).strip()
        q_clean = re.sub(r'[^a-z0-9\s]+', '', q_lower)
        q_clean = re.sub(r'\s+', ' ', q_clean).strip()
        processed.append(q_clean)
    return processed

def group_similar_questions(original_questions, processed_questions, similarity_threshold=0.65):
    embeddings = model.encode(processed_questions, convert_to_tensor=True)
    clusters = []
    used_indices = set()
    for i in range(len(embeddings)):
        if i in used_indices:
            continue
        current_cluster = [i]
        used_indices.add(i)
        for j in range(i + 1, len(embeddings)):
            if j in used_indices:
                continue
            sim = util.pytorch_cos_sim(embeddings[i], embeddings[j]).item()
            if sim >= similarity_threshold:
                current_cluster.append(j)
                used_indices.add(j)
        clusters.append(current_cluster)
    grouped_questions = []
    for cluster_indices in clusters:
        group = [original_questions[i] for i in cluster_indices]
        grouped_questions.append(group)
    return grouped_questions
        
def label_clusters_by_frequency(grouped_questions):
    labeled = []
    for group in grouped_questions:
        rep_question = group[0]
        frequency = len(group)
        if frequency >= 4:
            label = "🔴 Frequently Asked"
        elif frequency >= 2:
            label = "🟠 Occasionally Asked"
        else:
            label = "🟢 Rarely Asked"
        labeled.append((label, rep_question, frequency, group))
    return labeled

def group_clusters_by_label(labeled_clusters):
    grouped = defaultdict(list)
    for label, question, count, group in labeled_clusters:
        grouped[label].append((question, count, group))
    rows = []
    for label, questions in grouped.items():
        for question, count, group in questions:
            rows.append({
                "Cluster": label,
                "Question": question,
                "Count": count
            })
    df = pd.DataFrame(rows)
    df.to_csv("clustered_questions2.csv", index=False)
    return grouped

def generate_pca_plot(original_questions, grouped_questions):
    labels = []
    texts = []
    for idx, group in enumerate(grouped_questions):
        for q in group:
            texts.append(q)
            labels.append(idx)
    embeddings = model.encode(texts, convert_to_tensor=True)
    pca = PCA(n_components=2)
    reduced = pca.fit_transform(embeddings.cpu().numpy())
    plt.figure(figsize=(10, 7))
    plt.scatter(reduced[:, 0], reduced[:, 1], c=labels, cmap='tab10', alpha=0.7)
    plt.title("PCA of Question Embeddings")
    plt.xlabel("PC1")
    plt.ylabel("PC2")
    plt.grid(True)
    return plt
