const express = require('express');
const path = require('path');
const app = express();

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(express.static(__dirname));

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

app.get('/api/movies', async (req, res) => {
    try {
        const [popularResponse, topRatedResponse, trendingResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
            fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
            fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`)
        ]);
        
        const [popular, topRated, trending] = await Promise.all([
            popularResponse.json(),
            topRatedResponse.json(),
            trendingResponse.json()
        ]);
        
        const allMovies = [...popular.results.slice(0, 5), ...topRated.results.slice(0, 5), ...trending.results.slice(0, 5)];
        
        const formattedData = allMovies.map(item => ({
            id: item.id,
            name: item.title || item.name,
            imdb: item.vote_average,
            date: (item.release_date || item.first_air_date || '2024').split('-')[0],
            sposter: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300/1a1a1a/ffffff?text=No+Poster',
            bposter: item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : 'https://via.placeholder.com/500x281/1a1a1a/ffffff?text=No+Image',
            genre: item.media_type === 'tv' ? 'TV Series' : 'Movie',
            type: item.media_type === 'tv' ? 'series' : 'movie',
            media_type: item.media_type || 'movie',
            overview: item.overview || 'No description available'
        }));
        
        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching from TMDB:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }

        const response = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`);
        const data = await response.json();
        
        const formattedResults = data.results
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 10)
            .map(item => ({
                id: item.id,
                name: item.title || item.name,
                imdb: item.vote_average,
                date: (item.release_date || item.first_air_date || 'N/A').split('-')[0],
                sposter: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300/1a1a1a/ffffff?text=No+Poster',
                bposter: item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : 'https://via.placeholder.com/500x281/1a1a1a/ffffff?text=No+Image',
                genre: item.media_type === 'tv' ? 'TV Series' : 'Movie',
                type: item.media_type === 'tv' ? 'series' : 'movie',
                media_type: item.media_type,
                overview: item.overview || 'No description available'
            }));
        
        res.json(formattedResults);
    } catch (error) {
        console.error('Error searching TMDB:', error);
        res.status(500).json({ error: 'Failed to search movies' });
    }
});

app.get('/api/trending-regional', async (req, res) => {
    try {
        const [indiaResponse, usResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&watch_region=IN&with_original_language=hi|ta|te`),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&watch_region=US&with_original_language=en`)
        ]);
        
        const [indiaData, usData] = await Promise.all([
            indiaResponse.json(),
            usResponse.json()
        ]);
        
        const combinedMovies = [...indiaData.results.slice(0, 10), ...usData.results.slice(0, 10)];
        
        const formattedData = combinedMovies.map(item => ({
            id: item.id,
            name: item.title || item.name,
            imdb: item.vote_average,
            date: (item.release_date || item.first_air_date || '2024').split('-')[0],
            sposter: item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200x300/1a1a1a/ffffff?text=No+Poster',
            bposter: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=No+Image',
            genre: item.media_type === 'tv' ? 'TV Series' : 'Movie',
            type: item.media_type === 'tv' ? 'series' : 'movie',
            media_type: item.media_type || 'movie',
            overview: item.overview || 'No description available'
        }));
        
        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching trending regional movies:', error);
        res.status(500).json({ error: 'Failed to fetch trending movies' });
    }
});

app.get('/api/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const mediaType = req.query.type || 'movie';
        
        const [detailsResponse, creditsResponse, reviewsResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&language=en-US`),
            fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/credits?api_key=${TMDB_API_KEY}`),
            fetch(`${TMDB_BASE_URL}/${mediaType}/${id}/reviews?api_key=${TMDB_API_KEY}&language=en-US&page=1`)
        ]);
        
        const [details, credits, reviews] = await Promise.all([
            detailsResponse.json(),
            creditsResponse.json(),
            reviewsResponse.json()
        ]);
        
        const movieData = {
            id: details.id,
            title: details.title || details.name,
            overview: details.overview,
            rating: details.vote_average,
            vote_count: details.vote_count,
            release_date: details.release_date || details.first_air_date,
            runtime: details.runtime || (details.episode_run_time && details.episode_run_time[0]),
            genres: details.genres,
            poster: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
            backdrop: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : null,
            tagline: details.tagline,
            status: details.status,
            budget: details.budget,
            revenue: details.revenue,
            cast: credits.cast.slice(0, 10).map(person => ({
                name: person.name,
                character: person.character,
                profile: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null
            })),
            crew: credits.crew.filter(person => 
                person.job === 'Director' || person.job === 'Producer' || person.job === 'Writer'
            ).slice(0, 5).map(person => ({
                name: person.name,
                job: person.job,
                profile: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null
            })),
            reviews: reviews.results.slice(0, 5).map(review => ({
                author: review.author,
                content: review.content,
                rating: review.author_details.rating,
                created_at: review.created_at
            }))
        };
        
        res.json(movieData);
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

app.get('/movie-details.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'movie-details.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
