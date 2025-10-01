let left_btn = document.getElementsByClassName('bi-chevron-left')[0];
let right_btn = document.getElementsByClassName('bi-chevron-right')[0];
let cards = document.getElementsByClassName('cards')[0];
let search = document.getElementsByClassName('search')[0];
let search_input = document.getElementById('search_input');

left_btn.addEventListener('click', ()=> {
    cards.scrollLeft -= 140;
})
right_btn.addEventListener('click', ()=> {
    cards.scrollLeft += 140;
})

let trendingMovies = [];
let currentFeaturedIndex = 0;

async function fetchTrendingRegionalMovies() {
    const cachedData = localStorage.getItem('trending_regional');
    const cacheTime = localStorage.getItem('trending_cache_time');
    const now = new Date().getTime();
    
    if (cachedData && cacheTime && (now - cacheTime < 600000)) {
        try {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            localStorage.removeItem('trending_regional');
            localStorage.removeItem('trending_cache_time');
        }
    }
    
    try {
        const response = await fetch('/api/trending-regional');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem('trending_regional', JSON.stringify(data));
            localStorage.setItem('trending_cache_time', now.toString());
            return data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        return [];
    }
}

function displayFeaturedMovie(movie) {
    const header = document.querySelector('header');
    header.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('${movie.bposter}')`;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
    
    document.getElementById('title').innerText = movie.name;
    document.getElementById('gen').innerText = movie.genre;
    document.getElementById('date').innerText = movie.date;
    document.getElementById('rate').innerHTML = `<span>TMDB </span><i class="bi bi-star-fill"></i> ${movie.imdb.toFixed(1)}`;
    
    const contentP = document.querySelector('.content p');
    if (contentP && movie.overview) {
        contentP.innerText = movie.overview;
    }
}

function rotateFeaturedMovie() {
    if (trendingMovies.length === 0) return;
    
    currentFeaturedIndex = Math.floor(Math.random() * trendingMovies.length);
    displayFeaturedMovie(trendingMovies[currentFeaturedIndex]);
}

async function fetchMoviesFromServer() {
    const cachedData = localStorage.getItem('tmdb_movies');
    const cacheTime = localStorage.getItem('tmdb_cache_time');
    const now = new Date().getTime();
    
    if (cachedData && cacheTime && (now - cacheTime < 3600000)) {
        try {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            localStorage.removeItem('tmdb_movies');
            localStorage.removeItem('tmdb_cache_time');
        }
    }
    
    try {
        const response = await fetch('/api/movies');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            localStorage.setItem('tmdb_movies', JSON.stringify(data));
            localStorage.setItem('tmdb_cache_time', now.toString());
            return data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching movies:', error);
        localStorage.removeItem('tmdb_movies');
        localStorage.removeItem('tmdb_cache_time');
        return [];
    }
}

fetchTrendingRegionalMovies().then((trending) => {
    trendingMovies = trending;
    if (trendingMovies.length > 0) {
        rotateFeaturedMovie();
        setInterval(rotateFeaturedMovie, 600000);
    }
});

fetchMoviesFromServer().then((data) => {
    if (data.length === 0) {
        console.error('No movies loaded');
        return;
    }

    data.forEach((ele, i) => {
        let{ id, name, imdb, date, sposter, bposter, genre, media_type, overview } = ele;
        let card = document.createElement('a');
        card.classList.add('card');
        card.href = `/movie-details.html?id=${id}&type=${media_type || 'movie'}`;
        card.innerHTML = `
        <img src="${sposter}" alt="${name}" class="poster">
                    <div class="rest_card">
                        <img src="${bposter}" alt="">
                        <div class="cont">
                            <h4>${name}</h4>
                            <div class="sub">
                                <p>${genre}, ${date}</p>
                                <h3><span>TMDB </span><i class="bi bi-star-fill"></i> ${imdb.toFixed(1)}</h3>
                            </div>
                        </div>
                    </div>
        `
        
        card.addEventListener('mouseenter', () => {
            const header = document.querySelector('header');
            header.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('${bposter}')`;
            header.style.backgroundSize = 'cover';
            header.style.backgroundPosition = 'center';
            
            document.getElementById('title').innerText = name;
            document.getElementById('gen').innerText = genre;
            document.getElementById('date').innerText = date;
            document.getElementById('rate').innerHTML = `<span>TMDB </span><i class="bi bi-star-fill"></i> ${imdb.toFixed(1)}`;
            
            const contentP = document.querySelector('.content p');
            if (contentP && overview) {
                contentP.innerText = overview;
            }
        });
        
        cards.appendChild(card);
    });

    let searchTimeout;
    let searchResults = [];

    search.style.visibility = "hidden";
    search.style.opacity = 0;

    function renderSearchResults(results) {
        search.innerHTML = '';
        
        if (results.length === 0) {
            search.innerHTML = '<p style="color: #fff; padding: 10px; text-align: center;">No results found</p>';
            return;
        }
        
        results.forEach(movie => {
            let card = document.createElement('a');
            card.classList.add('card');
            card.href = `/movie-details.html?id=${movie.id}&type=${movie.media_type || 'movie'}`;
            card.innerHTML = `
                <img src="${movie.sposter}" alt="${movie.name}">
                <div class="cont">
                    <h3>${movie.name}</h3>
                    <p>${movie.genre}, ${movie.date}, <span>TMDB </span><i class="bi bi-star-fill"></i> ${movie.imdb.toFixed(1)}</p>
                </div>
            `;
            search.appendChild(card);
        });
    }

    async function searchMovies(query) {
        if (!query || query.trim() === '') {
            search.innerHTML = '';
            search.style.visibility = "hidden";
            search.style.opacity = 0;
            return;
        }
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            searchResults = results;
            renderSearchResults(results);
            search.style.visibility = "visible";
            search.style.opacity = 1;
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    search_input.addEventListener('focus', ()=> {
        const query = search_input.value.trim();
        if (query) {
            searchMovies(query);
        }
    });

    search_input.addEventListener('keyup', ()=> {
        clearTimeout(searchTimeout);
        const query = search_input.value.trim();
        
        if (!query) {
            search.innerHTML = '';
            search.style.visibility = "hidden";
            search.style.opacity = 0;
            return;
        }
        
        searchTimeout = setTimeout(() => {
            searchMovies(query);
        }, 300);
    });

    search_input.addEventListener('blur', (e)=> {
        setTimeout(() => {
            if (!search.matches(':hover') && document.activeElement !== search_input) {
                search.style.visibility = "hidden";
                search.style.opacity = 0;
            }
        }, 200);
    });

    search.addEventListener('mouseleave', ()=> {
        if (document.activeElement !== search_input) {
            search.style.visibility = "hidden";
            search.style.opacity = 0;
        }
    });

    let play = document.getElementById('play');
    play.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Movie playback feature - Coming soon!');
    })
    let series = document.getElementById('series');
    let movies = document.getElementById('movies');

    series.addEventListener('click', ()=> {
        cards.innerHTML = '';

        let series_array = data.filter(ele => {
            return ele.type === "series";
        });
        series_array.forEach((ele, i) => {
        let{ id, name, imdb, date, sposter, bposter, genre, media_type, overview } = ele;
        let card = document.createElement('a');
        card.classList.add('card');
        card.href = `/movie-details.html?id=${id}&type=${media_type || 'tv'}`;
        card.innerHTML = `
        <img src="${sposter}" alt="${name}" class="poster">
                    <div class="rest_card">
                        <img src="${bposter}" alt="">
                        <div class="cont">
                            <h4>${name}</h4>
                            <div class="sub">
                                <p>${genre}, ${date}</p>
                                <h3><span>TMDB </span><i class="bi bi-star-fill"></i> ${imdb.toFixed(1)}</h3>
                            </div>
                        </div>
                    </div>
        `
        
        card.addEventListener('mouseenter', () => {
            const header = document.querySelector('header');
            header.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('${bposter}')`;
            header.style.backgroundSize = 'cover';
            header.style.backgroundPosition = 'center';
            
            document.getElementById('title').innerText = name;
            document.getElementById('gen').innerText = genre;
            document.getElementById('date').innerText = date;
            document.getElementById('rate').innerHTML = `<span>TMDB </span><i class="bi bi-star-fill"></i> ${imdb.toFixed(1)}`;
            
            const contentP = document.querySelector('.content p');
            if (contentP && overview) {
                contentP.innerText = overview;
            }
        });
        
        cards.appendChild(card);
    });
    })

    movies.addEventListener('click', ()=> {
        cards.innerHTML = '';

        let movie_array = data.filter(ele => {
            return ele.type === "movie";
        });
        
        movie_array.forEach((ele, i) => {
        let{ id, name, imdb, date, sposter, bposter, genre, media_type, overview } = ele;
        let card = document.createElement('a');
        card.classList.add('card');
        card.href = `/movie-details.html?id=${id}&type=${media_type || 'movie'}`;
        card.innerHTML = `
        <img src="${sposter}" alt="${name}" class="poster">
                    <div class="rest_card">
                        <img src="${bposter}" alt="">
                        <div class="cont">
                            <h4>${name}</h4>
                            <div class="sub">
                                <p>${genre}, ${date}</p>
                                <h3><span>TMDB </span><i class="bi bi-star-fill"></i> ${imdb.toFixed(1)}</h3>
                            </div>
                        </div>
                    </div>
        `
        
        card.addEventListener('mouseenter', () => {
            const header = document.querySelector('header');
            header.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('${bposter}')`;
            header.style.backgroundSize = 'cover';
            header.style.backgroundPosition = 'center';
            
            document.getElementById('title').innerText = name;
            document.getElementById('gen').innerText = genre;
            document.getElementById('date').innerText = date;
            document.getElementById('rate').innerHTML = `<span>TMDB </span><i class="bi bi-star-fill"></i> ${imdb.toFixed(1)}`;
            
            const contentP = document.querySelector('.content p');
            if (contentP && overview) {
                contentP.innerText = overview;
            }
        });
        
        cards.appendChild(card);
    });

    })

    
});
