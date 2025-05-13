import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listAlbums, listPhotosInAlbum, searchPhotos } from '@core/services/photoService';
import PhotoUploadComponent from '../../components/photos/PhotoUploadComponent'; // Adjust path as needed
import CollapsibleTags from '../../components/ui/collapsible-tags';

const PhotoGalleryPage = () => {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]); // Can be used to show photos not in an album or search results
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        // Load albums
        const albumsResponse = await listAlbums();
        if (albumsResponse.success) {
          setAlbums(albumsResponse.data.albums || []);
        } else {
          setError(albumsResponse.error || 'Failed to load albums.');
        }

        // Load all photos initially
        const photosResponse = await searchPhotos({ recent: true });
        if (photosResponse.success) {
          setPhotos(photosResponse.data.photos || []);
        } else {
          console.error('Failed to load initial photos:', photosResponse.error);
        }

      } catch (err) {
        setError('An unexpected error occurred while fetching data.');
        console.error('Fetch initial data error:', err);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const handleSelectAlbum = async (albumId) => {
    setSelectedAlbum(albumId);
    setLoading(true);
    setError('');
    try {
      const photosResponse = await listPhotosInAlbum(albumId);
      if (photosResponse.success) {
        setPhotos(photosResponse.data.photos || []);
      } else {
        setError(photosResponse.error || `Failed to load photos for album ${albumId}.`);
        setPhotos([]); // Clear photos on error
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching photos.');
      console.error('Fetch photos in album error:', err);
      setPhotos([]);
    }
    setLoading(false);
  };

  const handlePhotoUploaded = (newPhoto) => {
    // Add to current view or refetch, depending on UX
    if (selectedAlbum && newPhoto.albumId === selectedAlbum) {
        // If we're in album view and the photo belongs to this album, add it to view
        setPhotos(prev => [newPhoto, ...prev]);
    } else if (!selectedAlbum) {
        // If we're in "All Photos" view, add the new photo to view
        setPhotos(prev => [newPhoto, ...prev]);
    }

    // Always refetch albums as the counts may have changed
    listAlbums().then(res => {
      if (res.success) {
        setAlbums(res.data.albums || []);
      }
    });
  };

  if (loading && albums.length === 0) {
    return <div className="p-4 text-center">Loading gallery...</div>;
  }

  return (
    <div className="w-full p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Photo Gallery</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 sm:py-2 px-3 sm:px-4 rounded text-sm sm:text-base w-full sm:w-auto"
        >
          Upload Photo
        </button>
      </div>

      {error && <div className="mb-4 p-2 sm:p-3 bg-red-100 text-red-700 rounded-md text-sm sm:text-base">Error: {error}</div>}

      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-2 sm:p-0">
          <div className="bg-white p-3 sm:p-5 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Upload New Photo</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-700 hover:text-gray-900 text-xl sm:text-2xl">&times;</button>
            </div>
            <PhotoUploadComponent
                albumId={selectedAlbum} // Pass selected album ID if any
                onPhotoUploaded={handlePhotoUploaded}
                onClose={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Album Selector - Dropdown style for small screens */}
      <div className="block md:hidden mb-4">
        <label htmlFor="album-select" className="block text-sm font-medium text-gray-700 mb-1">Select Album</label>
        <select
          id="album-select"
          className="w-full p-2 border border-gray-300 rounded-md bg-white"
          value={selectedAlbum || "all"}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "all") {
              setSelectedAlbum(null);
              setLoading(true);
              searchPhotos({ recent: true })
                .then(response => {
                  if (response.success) {
                    setPhotos(response.data.photos || []);
                  } else {
                    setError(response.error || 'Failed to load photos.');
                    setPhotos([]);
                  }
                  setLoading(false);
                })
                .catch(err => {
                  console.error('Error loading all photos:', err);
                  setError('Error loading photos');
                  setPhotos([]);
                  setLoading(false);
                });
            } else {
              handleSelectAlbum(value);
            }
          }}
        >
          <option value="all">All Photos</option>
          {albums.map(album => (
            <option key={album.id} value={album.id}>
              {album.name} ({album.photoCount})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Albums Section - Hidden on mobile, visible on md screens and up */}
        <div className="hidden md:block md:col-span-1 bg-gray-50 p-3 sm:p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Albums</h2>
            {selectedAlbum && (
              <button
                onClick={() => {
                  setSelectedAlbum(null);
                  setLoading(true);
                  searchPhotos({ recent: true })
                    .then(response => {
                      if (response.success) {
                        setPhotos(response.data.photos || []);
                      } else {
                        setError(response.error || 'Failed to load photos.');
                        setPhotos([]);
                      }
                      setLoading(false);
                    })
                    .catch(err => {
                      console.error('Error loading all photos:', err);
                      setError('Error loading photos');
                      setPhotos([]);
                      setLoading(false);
                    });
                }}
                className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                Show All
              </button>
            )}
          </div>

          {albums.length > 0 ? (
            <div className="space-y-2">
              {!selectedAlbum && (
                <div className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full inline-block mb-2">
                  All Photos
                </div>
              )}

              {selectedAlbum && (
                <div className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full inline-block mb-2">
                  {albums.find(a => a.id === selectedAlbum)?.name}
                </div>
              )}

              <CollapsibleTags
                tags={albums}
                initialVisibleCount={5}
                onTagClick={(album) => handleSelectAlbum(album.id)}
                showFilter={false}
                getTagLabel={(album) => `${album.name} (${album.photoCount})`}
                getTagValue={(album) => album.id}
                className="mt-1"
              />
            </div>
          ) : (
            <p className="text-gray-500 text-xs">No albums found.</p>
          )}
        </div>

        {/* Photos Display Section */}
        <div className="md:col-span-3">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-gray-700">
            {selectedAlbum ? albums.find(a=>a.id === selectedAlbum)?.name : 'Photos'}
          </h2>
          {loading && photos.length === 0 ? (
            <p className="text-center text-gray-500 text-sm sm:text-base">Loading photos...</p>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {photos.map(photo => (
                <Link key={photo.id} to={`/photos/${photo.id}`} className="group">
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-md sm:shadow-lg hover:shadow-xl transition-shadow">
                    <img
                      src={photo.url || `https://via.placeholder.com/300?text=${photo.title.replace(/\s/g, '+')}`}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-700 truncate group-hover:text-indigo-600">{photo.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm sm:text-base">
              {selectedAlbum ? 'No photos in this album.' : 'No photos to display.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryPage;
