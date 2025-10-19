# server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from google.genai import types
from google import genai
import urllib.parse

# Import all your existing functions from clustering_module
from clustering_module import (
    extract_questions_from_pdf,
    preprocess_questions,
    group_similar_questions,
    label_clusters_by_frequency,
    group_clusters_by_label
)

app = Flask(__name__)
CORS(app)

client = genai.Client()

@app.route('/upload', methods=['POST'])
def upload_file():
    # This function remains the same
    try:
        if 'file' not in request.files:
            return jsonify({'message': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400
        original_questions = extract_questions_from_pdf(file)
        if not original_questions:
             return jsonify({'message': 'Could not extract any questions from the PDF.'}), 400
        
        # We need to return the full list of questions for the summary
        all_questions_flat = [q for q in original_questions]

        processed_for_clustering = preprocess_questions(original_questions)
        groups = group_similar_questions(original_questions, processed_for_clustering, similarity_threshold=0.85)
        labeled_clusters = label_clusters_by_frequency(groups)
        grouped_results = group_clusters_by_label(labeled_clusters)

        return jsonify({
            'message': f'File {file.filename} processed successfully!',
            'questions': grouped_results,
            'all_questions': all_questions_flat # Send all questions for the summary
        }), 200
    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get-answer', methods=['POST'])
def get_answer():
    # This function remains the same
    try:
        data = request.get_json()
        question = data.get('question')
        if not question:
            return jsonify({'error': 'No question provided'}), 400
        prompt = f"""Provide a clear, detailed, and well-formatted answer for the following academic question...
        Question: {question}\nAnswer:"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return jsonify({'answer': response.text})
    except Exception as e:
        print(f"GET ANSWER ERROR: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get-video', methods=['POST'])
def get_video():
    # This function remains the same
    try:
        data = request.get_json()
        question = data.get('question')
        if not question:
            return jsonify({'error': 'No question provided'}), 400
        search_query = question.split('\n\n')[0]
        encoded_query = urllib.parse.quote_plus(search_query)
        youtube_url = f"https://www.youtube.com/results?search_query={encoded_query}"
        return jsonify({'videoUrl': youtube_url})
    except Exception as e:
        print(f"GET VIDEO ERROR: {e}")
        return jsonify({'error': str(e)}), 500

# --- NEW ENDPOINT FOR GENERATING A SUMMARY ---
@app.route('/get-summary', methods=['POST'])
def get_summary():
    try:
        data = request.get_json()
        questions = data.get('questions')

        if not questions:
            return jsonify({'error': 'No questions provided for summary'}), 400

        # Join all questions into a single text block for the prompt
        questions_text = "\n".join(questions)

        prompt = f"""Analyze the following list of academic questions and generate a concise summary. The summary should be well-structured using Markdown.

        Your summary MUST include the following sections:
        1.  **Key Topics:** A bulleted list of the main concepts and subjects covered in the questions.
        2.  **Most Frequent Topics:** A short paragraph identifying the topics that appear most frequently, based on the provided questions.
        3.  **Overall Focus:** A brief conclusion about the overall focus of the question paper (e.g., "This paper focuses heavily on practical application and data interpretation...").

        Here are the questions:
        {questions_text}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return jsonify({'summary': response.text})

    except Exception as e:
        print(f"GET SUMMARY ERROR: {e}")
        return jsonify({'error': str(e)}), 500
# --- END OF NEW ENDPOINT ---

if __name__ == '__main__':
    print("Server is running on port 5001...")
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
