
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from clustering_module import (
    extract_questions_from_pdf,
    preprocess_questions,
    group_similar_questions,
    label_clusters_by_frequency,
    group_clusters_by_label,
    generate_pca_plot
)
#
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload')
# ‘/’ URL is bound with hello_world() function.
def hello_world():
    return 'Hello World'


@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            print("no file")
            return jsonify({'message': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            print("no selected file")
            return jsonify({'message': 'No selected file'}), 400
        all_questions = []
        # Process the file directly without saving
        print(file.content_length)
        questions = extract_questions_from_pdf(file)
        all_questions.extend(questions)
        print("Sus")
       

        preprocess_questions(questions)

        groups = group_similar_questions(all_questions, similarity_threshold=0.5)
        labeled_clusters = label_clusters_by_frequency(groups)
        grouped_results = group_clusters_by_label(labeled_clusters)

        print("These are the grouped results",grouped_results)
        

        return jsonify({
            'message': f'File {file.filename} processed successfully!',
            'questions': grouped_results,
            'length': len(all_questions)
        }), 200

    except Exception as e:
        print("UPLOAD ERROR:", e)
        return jsonify({'error': str(e)}), 500

# main driver function
if __name__ == '__main__':
    print("Server is running on port 5001...")
    app.run(port=5001, debug=True)
      