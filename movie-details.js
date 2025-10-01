const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const mediaType = urlParams.get('type') || 'movie';

async function fetchMovieDetails() {
    if (!movieId) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch(`/api/movie/${movieId}?type=${mediaType}`);
        const movie = await response.json();
        
        displayMovieDetails(movie);
    } catch (error) {
        console.error('Error fetching movie details:', error);
        document.getElementById('movieTitle').textContent = 'Error loading movie details';
    }
}

function displayMovieDetails(movie) {
    document.title = `${movie.title} - TMDB`;
    
    const movieHeader = document.getElementById('movieHeader');
    if (movie.backdrop) {
        movieHeader.style.backgroundImage = `url(${movie.backdrop})`;
    }
    
    document.getElementById('moviePoster').src = movie.poster || 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Poster';
    document.getElementById('movieTitle').textContent = movie.title;
    
    if (movie.tagline) {
        document.getElementById('movieTagline').textContent = `"${movie.tagline}"`;
    }
    
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    document.getElementById('releaseDate').innerHTML = `<i class="bi bi-calendar-event"></i> ${releaseYear}`;
    
    if (movie.runtime) {
        const hours = Math.floor(movie.runtime / 60);
        const minutes = movie.runtime % 60;
        document.getElementById('runtime').innerHTML = `<i class="bi bi-clock"></i> ${hours}h ${minutes}m`;
    }
    
    document.getElementById('rating').innerHTML = `<i class="bi bi-star-fill"></i> ${movie.rating.toFixed(1)} (${movie.vote_count.toLocaleString()} votes)`;
    
    const genresContainer = document.getElementById('genres');
    if (movie.genres && movie.genres.length > 0) {
        genresContainer.innerHTML = movie.genres.map(genre => 
            `<span class="genre-tag">${genre.name}</span>`
        ).join('');
    }
    
    document.getElementById('overview').textContent = movie.overview || 'No overview available.';
    
    displayCast(movie.cast);
    displayCrew(movie.crew);
    displayReviews(movie.reviews);
}

function displayCast(cast) {
    const castContainer = document.getElementById('cast');
    
    if (!cast || cast.length === 0) {
        castContainer.innerHTML = '<div class="no-data">No cast information available</div>';
        return;
    }
    
    castContainer.innerHTML = cast.map(person => `
        <div class="cast-card">
            <img src="${person.profile || 'https://via.placeholder.com/150x200/1a1a1a/ffffff?text=' + person.name.charAt(0)}" alt="${person.name}">
            <div class="name">${person.name}</div>
            <div class="character">${person.character || 'Unknown'}</div>
        </div>
    `).join('');
}

function displayCrew(crew) {
    const crewContainer = document.getElementById('crew');
    
    if (!crew || crew.length === 0) {
        crewContainer.innerHTML = '<div class="no-data">No crew information available</div>';
        return;
    }
    
    crewContainer.innerHTML = crew.map(person => `
        <div class="crew-card">
            <img src="${person.profile || 'https://via.placeholder.com/60x60/1a1a1a/ffffff?text=' + person.name.charAt(0)}" alt="${person.name}">
            <div class="crew-info">
                <div class="name">${person.name}</div>
                <div class="job">${person.job}</div>
            </div>
        </div>
    `).join('');
}

function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews');
    
    if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML = '<div class="no-data">No reviews available</div>';
        return;
    }
    
    reviewsContainer.innerHTML = reviews.map(review => {
        const content = review.content.length > 500 
            ? review.content.substring(0, 500) + '...' 
            : review.content;
        
        const date = new Date(review.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div class="review-card">
                <div class="review-header">
                    <div>
                        <div class="review-author">${review.author}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 5px;">${date}</div>
                    </div>
                    ${review.rating ? `<div class="review-rating"><i class="bi bi-star-fill"></i> ${review.rating}/10</div>` : ''}
                </div>
                <div class="review-content">${content}</div>
            </div>
        `;
    }).join('');
}

fetchMovieDetails();
