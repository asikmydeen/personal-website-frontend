import React, { useState } from "react";
import { searchPhotos } from "../../services/photoService"; // Adjust path as needed
import { Link } from "react-router-dom";

const PhotoSearchComponent = ({ onSearchResults }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a search term.");
      setResults([]);
      if (onSearchResults) onSearchResults([]); // Clear parent results
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await searchPhotos(query);
      if (response.success && response.data.photos) {
        setResults(response.data.photos);
        if (onSearchResults) {
          onSearchResults(response.data.photos);
        }
      } else {
        setError(response.error || "Search failed.");
        setResults([]);
        if (onSearchResults) onSearchResults([]);
      }
    } catch (err) {
      setError("An unexpected error occurred during search.");
      console.error("Search error:", err);
      setResults([]);
      if (onSearchResults) onSearchResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="my-4 p-4 bg-gray-50 rounded-lg shadow">
      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search photos by tag, location..."
          className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      
      {/* Display results within this component or pass to parent via onSearchResults */}
      {/* This example shows results here for self-contained demonstration */}
      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-2">Search Results:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.map(photo => (
              <Link key={photo.id} to={`/photos/${photo.id}`} className="group">
                <div className="aspect-square bg-gray-200 rounded-md overflow-hidden shadow hover:shadow-md transition-shadow">
                  <img 
                    src={photo.url || `https://via.placeholder.com/150?text=${encodeURIComponent(photo.title)}`}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-600 truncate group-hover:text-indigo-500">{photo.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
      {results.length === 0 && query && !loading && !error && (
          <p className="text-sm text-gray-500 mt-2">No photos found for "{query}".</p>
      )}
    </div>
  );
};

export default PhotoSearchComponent;

