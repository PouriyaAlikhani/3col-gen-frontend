"use client"; // This directive marks the component as a Client Component

import React, { useState, useEffect } from 'react';

// Define this flag at the top level for easy toggling.
// Set to `true` for frontend development/mocking.
// Set to `false` when your Python backend is deployed and ready.
const USE_MOCK_BACKEND = true;

// Main component for the graph generator interface
const GraphGeneratorPage = () => {
    // State to store the user input for the maximum number of vertices (x)
    const [maxVertices, setMaxVertices] = useState(50);
    // State to manage loading status during graph generation
    const [isLoading, setIsLoading] = useState(false);
    // State to store the download link for the generated graph
    const [downloadLink, setDownloadLink] = useState('');
    // State to store any error messages
    const [error, setError] = useState('');
    // State to store the backend API URL (placeholder for now)
    // IMPORTANT: Replace this with your actual deployed Python backend API URL
    const [backendUrl, setBackendUrl] = useState('YOUR_PYTHON_BACKEND_API_URL_HERE');

    // Function to handle the graph generation process
    // This function needs to be defined INSIDE the component to access state variables
    const handleGenerateGraph = async () => {
        // Clear previous results and errors
        setDownloadLink('');
        setError('');
        setIsLoading(true); // Set loading true at the very beginning of the operation

        try {
            if (USE_MOCK_BACKEND) {
                // --- START MOCKING LOGIC ---
                // Simulate an API call delay
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds

                // Simulate a successful response with a dummy download URL
                const simulatedDownloadUrl = `https://example.com/generated_graph_${maxVertices}_${Date.now()}.gml`;
                setDownloadLink(simulatedDownloadUrl);
                setError(''); // Clear any previous errors
                console.log("Simulated graph generation successful!");

                // You can also simulate an an error for testing error handling:
                // throw new Error("Simulated backend error: Graph generation failed.");

                // --- END MOCKING LOGIC ---
            } else {
                // --- START REAL BACKEND LOGIC ---
                // Basic validation for backend URL
                if (!backendUrl || backendUrl === 'YOUR_PYTHON_BACKEND_API_URL_HERE') {
                    setError('Please set your Python backend API URL in the code.');
                    // Do not set isLoading(false) here; the outer finally block will handle it.
                    return; // Exit early if validation fails
                }

                // Basic validation for max_vertices input
                if (isNaN(maxVertices) || maxVertices <= 0) {
                    setError('Please enter a valid positive number for maximum vertices.');
                    // Do not set isLoading(false) here; the outer finally block will handle it.
                    return; // Exit early if validation fails
                }

                // Make a POST request to the backend API
                const response = await fetch(`${backendUrl}/generate-graph`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ max_vertices: maxVertices }), // Send max_vertices to backend
                });

                // Check if the response was successful
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to generate graph due to server error.');
                }

                // Parse the JSON response from the backend
                const data = await response.json();
                // Set the download link received from the backend
                setDownloadLink(data.download_url);
                // --- END REAL BACKEND LOGIC ---
            }
        } catch (err) {
            // This single catch block handles errors from both mock and real logic
            console.error('Error during graph generation:', err);
            setError(`Error: ${err.message}. Please ensure the backend is running and accessible (if not mocking).`);
        } finally {
            // This single finally block ensures isLoading is set to false regardless of success or failure
            setIsLoading(false);
        }
    };

    // useEffect for initial console log (optional, for development clarity)
    useEffect(() => {
        if (USE_MOCK_BACKEND) {
            console.log("Frontend is running in MOCK BACKEND mode.");
        } else {
            console.log("Frontend is running in REAL BACKEND mode. Ensure backendUrl is set.");
        }
    }, []); // Empty dependency array means this runs once on component mount

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
            {/* These tags are moved here to resolve the compilation error in the immersive environment.
                In a full Next.js project, you would typically use `next/head` or the App Router's metadata API. */}
            <title>Graph Generator - Pouriya Alikhani</title>
            <meta name="description" content="Interactive graph generator based on Mizuno & Nishihara heuristic." />
            <link href="https://cdn.tailwindcss.com" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    Mizuno & Nishihara Graph Generator
                </h1>

                <p className="text-gray-600 text-center mb-6">
                    Generate a 3-colorability instance. The generation terminates when the number of vertices surpasses your specified value.
                </p>

                <div className="mb-6">
                    <label htmlFor="maxVertices" className="block text-gray-700 text-sm font-semibold mb-2">
                        Maximum Number of Vertices (x):
                    </label>
                    <input
                        type="number"
                        id="maxVertices"
                        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        value={maxVertices}
                        onChange={(e) => setMaxVertices(parseInt(e.target.value) || 0)} // Ensure integer value
                        min="1"
                        placeholder="e.g., 509"
                    />
                </div>

                <button
                    onClick={handleGenerateGraph}
                    disabled={isLoading} // Disable button while loading
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white transition duration-300 ease-in-out
                                ${isLoading
                                    ? 'bg-blue-300 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 shadow-md hover:shadow-lg'
                                }`}
                >
                    {isLoading ? 'Generating Graph...' : 'Generate Graph'}
                </button>

                {/* Display area for download link or error */}
                {downloadLink && (
                    <div className="mt-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg text-center">
                        <p className="mb-2">Graph generated successfully!</p>
                        <a
                            href={downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline font-semibold break-all"
                        >
                            Download Generated Graph
                        </a>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-center">
                        <p>{error}</p>
                    </div>
                )}

                <div className="mt-8 text-sm text-gray-500 text-center">
                    <p>
                        This interactive feature demonstrates the Mizuno & Nishihara heuristic.
                        For a fully functional version, you need to deploy a Python backend API.
                    </p>
                    <p className="mt-2">
                        For more details on the underlying research, refer to my Nature paper on experimental zero-knowledge protocols.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GraphGeneratorPage;
