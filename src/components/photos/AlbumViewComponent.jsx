import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAlbumDetails, listPhotosInAlbum } from '@core/services/photoService';

const AlbumViewComponent = () => {
  const { albumId } = useParams(); // Assuming route is /albums/:albumId
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!albumId) return;

    const fetchAlbumData = async () => {
      setLoading(true);
      setError('');
      try {
        const albumDetailsResponse = await getAlbumDetails(albumId);
        if (albumDetailsResponse.success && albumDetailsResponse.data.album) {
          setAlbum(albumDetailsResponse.data.album);
        } else {
          setError(albumDetailsResponse.error || `Failed to load album ${albumId}.`);
          setLoading(false);
          return;
        }

        const photosResponse = await listPhotosInAlbum(albumId);
        if (photosResponse.success && photosResponse.data.photos) {
          setPhotos(photosResponse.data.photos);
        } else {
          setError(photosResponse.error || `Failed to load photos for album ${albumId}.`);
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching album data.');
        console.error('Fetch album data error:', err);
      }
      setLoading(false);
    };

    fetchAlbumData();
  }, [albumId]);

  if (loading) {
    return <div className="p-4 text-center">Loading album...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!album) {
    return <div className="p-4 text-center">Album not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link to="/photos" className="text-indigo-600 hover:text-indigo-800">&larr; Back to Gallery</Link>
        <h1 className="text-3xl font-bold text-gray-800 mt-2">{album.name}</h1>
        {album.description && <p className="text-gray-600 mt-1">{album.description}</p>}
        <p className="text-sm text-gray-500 mt-1">Created on: {new Date(album.createdAt).toLocaleDateString()}</p>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map(photo => (
            <Link key={photo.id} to={`/photos/${photo.id}`} className="group">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <img
                  src={photo.url || `https://via.placeholder.com/300?text=${encodeURIComponent(photo.title)}`}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="mt-2 text-sm text-gray-700 truncate group-hover:text-indigo-600">{photo.title}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No photos in this album yet.</p>
      )}
      {/* TODO: Add PhotoUploadComponent here or a button to trigger it for this specific album */}
    </div>
  );
};

export default AlbumViewComponent;
