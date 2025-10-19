import re
from clustering_module import (
    extract_questions_from_pdf,
    preprocess_questions,
    group_similar_questions,
    label_clusters_by_frequency,
    group_clusters_by_label,
    generate_pca_plot
)

st.set_page_config(page_title="Question Frequency Analyzer", layout="wide")

st.title("Question Paper Analyzer 📚")
st.markdown(
    "Upload one or more Question Papers to identify frequently asked questions based on "
    "**semantic similarity and frequency**."
)

uploaded_files = st.file_uploader("Upload PDF(s) here", type="pdf", accept_multiple_files=True)

st.sidebar.subheader("Semantic Grouping Parameters")
similarity_threshold = st.sidebar.slider("Similarity Threshold", min_value=0.5, max_value=0.95, value=0.8, step=0.01)

show_pca = st.sidebar.checkbox("Show PCA Cluster Visualization")

def clean_for_display(q):
    q = re.sub(r'\s+', ' ', q).strip()
    return q

if uploaded_files:
    all_questions = []

    for uploaded_file in uploaded_files:
        try:
            questions = extract_questions_from_pdf(uploaded_file)
            all_questions.extend(questions)
        except Exception as e:
            st.error(f"❌ Failed to extract from {uploaded_file.name}: {str(e)}")

    if all_questions:
        st.success(f"✅ Extracted {len(all_questions)} questions from uploaded PDFs.")

        groups = group_similar_questions(all_questions, similarity_threshold=similarity_threshold)
        labeled_clusters = label_clusters_by_frequency(groups)
        grouped_results = group_clusters_by_label(labeled_clusters)

        for label, questions in grouped_results.items():
            with st.expander(f"{label} ({len(questions)} questions)"):
                for q, count, similar_group in questions:
                    if count > 1:
                        st.markdown(f"**[{count} times]** {clean_for_display(q)}")
                        if st.button(f"Show all similar versions for: {clean_for_display(q)}", key=f"btn_{clean_for_display(q)}"):
                            for variant in similar_group:
                                st.markdown(f"- {clean_for_display(variant)}")
                    else:
                        st.markdown(f"- **[1 time]** {clean_for_display(q)}")

        if show_pca:
            st.subheader("🧐 PCA Cluster Visualization of Question Embeddings")
            fig = generate_pca_plot(all_questions, groups)
            st.pyplot(fig)
    else:
        st.warning("⚠️ No valid questions found in the uploaded files.")