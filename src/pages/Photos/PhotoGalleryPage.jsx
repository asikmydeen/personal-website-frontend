import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listAlbums, listPhotosInAlbum, searchPhotos } from '../../services/photoService'; // Adjust path as needed
import PhotoUploadComponent from '../../components/photos/PhotoUploadComponent'; // Adjust path as needed

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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Photo Gallery</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Upload Photo
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Upload New Photo</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-700 hover:text-gray-900 text-2xl">&times;</button>
            </div>
            <PhotoUploadComponent
                albumId={selectedAlbum} // Pass selected album ID if any
                onPhotoUploaded={handlePhotoUploaded}
                onClose={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Albums Section */}
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Albums</h2>
          {albums.length > 0 ? (
            <ul className="space-y-2">
              <li
                key="all-photos"
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
                className={`p-2 rounded-md cursor-pointer ${!selectedAlbum ? 'bg-indigo-500 text-white' : 'bg-white hover:bg-indigo-100'}`}
              >
                All Photos
              </li>
              {albums.map(album => (
                <li
                  key={album.id}
                  onClick={() => handleSelectAlbum(album.id)}
                  className={`p-2 rounded-md cursor-pointer ${selectedAlbum === album.id ? 'bg-indigo-500 text-white' : 'bg-white hover:bg-indigo-100'}`}
                >
                  {album.name} ({album.photoCount})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No albums found.</p>
          )}
        </div>

        {/* Photos Display Section */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">
            {selectedAlbum ? albums.find(a=>a.id === selectedAlbum)?.name : 'Photos'}
          </h2>
          {loading && photos.length === 0 ? (
            <p className="text-center text-gray-500">Loading photos...</p>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <Link key={photo.id} to={`/photos/${photo.id}`} className="group">
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <img
                      src={photo.url || `https://via.placeholder.com/300?text=${photo.title.replace(/\s/g, '+')}`}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-700 truncate group-hover:text-indigo-600">{photo.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              {selectedAlbum ? 'No photos in this album.' : 'No photos to display.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryPage;
