    # app.py
    from flask import Flask, request, jsonify, send_file
    from flask_cors import CORS
    import os
    import networkx as nx # Used for graph operations
    import random
    import uuid # For generating unique filenames

    app = Flask(__name__)
    CORS(app) # Enable CORS for cross-origin requests from your frontend

    # Define a temporary directory for storing generated graphs
    # In a production environment (like Cloud Run), this would typically be cloud storage (e.g., Google Cloud Storage)
    # or the file would be streamed directly without saving to disk.
    # For this example, we'll use a local 'generated_graphs' directory within the container.
    OUTPUT_DIR = 'generated_graphs'
    os.makedirs(OUTPUT_DIR, exist_ok=True) # Ensure the directory exists when the app starts

    # --- Graph Generation Logic (Mizuno & Nishihara Heuristic - Placeholder) ---
    # IMPORTANT: You MUST replace the content of this function with your actual, robust
    # implementation of the Mizuno & Nishihara heuristic.
    # This current implementation is a simplified placeholder for demonstration purposes.

    def generate_mizuno_nishihara_graph(max_vertices):
        """
        Generates a graph conceptually based on Mizuno & Nishihara's heuristic.
        This is a placeholder. You need to implement your actual graph construction logic here.
        The heuristic involves constructing smaller 'EHI' (Edge-Hard Instances) graphs
        and combining them. For demonstration, we'll create a random graph that grows.
        """
        G = nx.Graph()
        nodes_added = 0

        # Start with a small initial structure
        if max_vertices >= 3:
            G.add_edges_from([(0, 1), (1, 2), (2, 0)])
            nodes_added = 3
        elif max_vertices >= 1:
            G.add_node(0)
            nodes_added = 1

        # Simulate the iterative growth
        while nodes_added < max_vertices:
            new_node = nodes_added
            G.add_node(new_node)

            num_edges_to_add = random.randint(1, min(3, nodes_added))
            existing_nodes = list(G.nodes())[:-1]

            if not existing_nodes:
                nodes_added += 1
                continue

            for _ in range(num_edges_to_add):
                target_node = random.choice(existing_nodes)
                if not G.has_edge(new_node, target_node):
                    G.add_edge(new_node, target_node)

            nodes_added += 1

        print(f"Generated graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges for max_vertices={max_vertices}.")
        return G

    # --- API Endpoint for Graph Generation ---

    @app.route('/generate-graph', methods=['POST'])
    def generate_graph_endpoint():
        try:
            data = request.get_json()
            max_vertices = data.get('max_vertices', 50) # Default to 50 if not provided

            if not isinstance(max_vertices, int) or max_vertices <= 0:
                return jsonify({"message": "Invalid 'max_vertices' provided. Must be a positive integer."}), 400

            # Call your graph generation function
            graph = generate_mizuno_nishihara_graph(max_vertices)

            # Generate a unique filename for the graph
            filename = f"graph_{uuid.uuid4().hex}.gml"
            filepath = os.path.join(OUTPUT_DIR, filename)

            # Save the graph to the temporary directory
            nx.write_gml(graph, filepath)
            print(f"Graph saved to {filepath}")

            # Construct the download URL.
            # For Cloud Run, this URL will typically be the Cloud Run service URL + /download-graph/<filename>
            # For local testing, it will be http://localhost:8080/download-graph/<filename>
            # In a real production scenario, you might upload to Google Cloud Storage and return that public URL.
            download_url = f"{request.url_root}download-graph/{filename}"

            return jsonify({"download_url": download_url, "message": "Graph generated successfully!"})

        except Exception as e:
            print(f"Error in generate_graph_endpoint: {e}")
            # Return a generic error message to the frontend for security
            return jsonify({"message": "An internal server error occurred during graph generation."}), 500

    # --- API Endpoint for Downloading Generated Graphs ---

    @app.route('/download-graph/<filename>', methods=['GET'])
    def download_graph(filename):
        """
        Endpoint to serve the generated graph file.
        Note: For production, consider secure file serving from cloud storage.
        """
        filepath = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(filepath):
            # Ensure the file is within the intended directory to prevent directory traversal attacks
            if os.path.commonprefix([os.path.realpath(filepath), os.path.realpath(OUTPUT_DIR)]) != os.path.realpath(OUTPUT_DIR):
                return jsonify({"message": "Access denied to this file."}), 403
            return send_file(filepath, as_attachment=True, download_name=filename, mimetype='application/gml')
        else:
            return jsonify({"message": "File not found."}), 404

    # --- Main entry point for running the Flask app locally ---
    # When deployed to Cloud Run, Gunicorn (specified in Dockerfile) will run the app.
    if __name__ == '__main__':
        app.run(debug=True, host='0.0.0.0', port=8080) # Cloud Run expects port 8080
    