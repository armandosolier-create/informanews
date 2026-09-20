/**
 * ============================================================================
 * JAVASCRIPT - APLICATIVO INFORMANEWS
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// ----------------------------------------------------------------------------
let newsData = []; // Arreglo dinámico poblado desde el archivo JSON
let favorites = JSON.parse(localStorage.getItem('informanews_favs')) || [];
let currentDetailId = 1;
let showFavoritesOnly = false;

// ----------------------------------------------------------------------------
// 2. CARGA ASÍNCRONA DE DATOS DESDE JSON (FETCH API)
// ----------------------------------------------------------------------------
/**
 * Carga de datos dinámicos desde el archivo externo JSON.
 */
async function loadDataFromJSON() {
    try {
        // Petición HTTP al archivo JSON estático
        const response = await fetch('data/data.json');
        
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status} - ${response.statusText}`);
        }
        
        newsData = await response.json();
        
        // Una vez cargados los datos, renderizamos la interfaz
        renderAllGrids();
    } catch (error) {
        console.error("Error al cargar la información desde JSON:", error);
        
        // Renderizado de mensaje de error si falla la carga dinámicamente
        const featuredContainer = document.getElementById('featured-news-grid');
        const newsContainer = document.getElementById('all-news-grid');
        
        const errorMessage = `
            <div class="col-span-full text-center py-10 px-4 bg-red-50 rounded-2xl border border-red-100 space-y-2">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                <p class="text-red-700 font-semibold">No se pudieron cargar las noticias/servicios desde el archivo JSON.</p>
                <p class="text-gray-500 text-xs">Asegúrate de estar ejecutando el proyecto a través de un servidor local (ej. Live Server).</p>
            </div>
        `;

        if (featuredContainer) featuredContainer.innerHTML = errorMessage;
        if (newsContainer) newsContainer.innerHTML = errorMessage;
    }
}

// ----------------------------------------------------------------------------
// 3. ENRUTAMIENTO Y NAVEGACIÓN EN EL DOM (SPA)
// ----------------------------------------------------------------------------
/**
 * Cambia la vista visible de la aplicación dinámicamente y actualiza títulos.
 * @param {string} pageId - ID de la página ('home', 'news', 'categories', 'favorites', 'contact', 'detail')
 */
function navigateTo(pageId) {

    showFavoritesOnly = (pageId === 'favorites');
    const targetPage = showFavoritesOnly ? 'news' : pageId;

    // Actualizar Título y Subtítulo dinámicamente según la sección
    const newsTitle = document.getElementById('news-title');
    const newsSubtitle = document.getElementById('news-subtitle');

    if (newsTitle) {
        if (pageId === 'categories') {
            newsTitle.textContent = 'Explore nuestras Categorías';
            if (newsSubtitle) newsSubtitle.textContent = 'Filtra y descubre publicaciones por la categoría de tu interés.';
        } else if (pageId === 'favorites') {
            newsTitle.textContent = 'Tus Noticias Favoritas';
            if (newsSubtitle) newsSubtitle.textContent = 'Aquí encontrarás todas las noticias que has guardado.';
        } else {
            // Por defecto (noticias, home, u otra sección) restaura el título original
            newsTitle.textContent = 'Últimas noticias';
            if (newsSubtitle) newsSubtitle.textContent = 'Explora información de actualidad por categoría.';
        }
    }

    // Oculta todas las páginas
    document.querySelectorAll('.view-page').forEach(page => page.classList.add('hidden'));

    // Muestra la vista objetivo
    const activePage = document.getElementById(`page-${targetPage}`);
    if (activePage) activePage.classList.remove('hidden');

    // Actualiza estilos activos en la navegación
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active-nav'));
    
    if (pageId === 'home') document.getElementById('nav-home')?.classList.add('active-nav');
    if (pageId === 'news') document.getElementById('nav-news')?.classList.add('active-nav');
    if (pageId === 'categories') document.getElementById('nav-categories')?.classList.add('active-nav');
    if (pageId === 'favorites') document.getElementById('nav-favorites')?.classList.add('active-nav');
    if (pageId === 'contact') document.getElementById('nav-contact')?.classList.add('active-nav');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (showFavoritesOnly || pageId === 'news' || pageId === 'categories') {
        handleFilter();
    }
}

/**
 * Alterna la visibilidad del menú móvil hamburguesa.
 */
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
}


// ----------------------------------------------------------------------------
// 4. RENDERIZADO DE COMPONENTES
// ----------------------------------------------------------------------------
/**
 * Genera el marcado HTML para una tarjeta de noticia.
 * @param {Object} item - Objeto noticia.
 * @returns {string} HTML estructurado de la tarjeta.
 */
function renderCardHTML(item) {
    const isFav = favorites.includes(item.id);
    return `
        <div class="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all-custom flex flex-col justify-between">
            <div>
                <div class="h-48 overflow-hidden bg-gray-100 relative">
                    <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105">
                </div>
                <div class="p-6 space-y-3">
                    <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">${item.category}</span>
                    <h3 class="text-xl font-bold text-gray-900 leading-snug line-clamp-2">${item.title}</h3>
                    <p class="text-gray-500 text-sm line-clamp-2">${item.excerpt}</p>
                </div>
            </div>
            <div class="px-6 pb-6 pt-2 flex items-center justify-between border-t border-gray-50 mt-auto">
                <button onclick="openNewsDetail(${item.id})" class="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                    Ver más <i class="fas fa-arrow-right text-xs"></i>
                </button>
                <button onclick="toggleFavorite(${item.id})" class="text-red-500 text-lg focus:outline-none p-1 hover:scale-110 transition-transform" aria-label="Favorito">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Renderiza las grillas de noticias iniciales.
 */
function renderAllGrids() {
    const featuredContainer = document.getElementById('featured-news-grid');
    if (featuredContainer) {
        const featured = newsData.filter(n => n.featured);
        featuredContainer.innerHTML = featured.map(item => renderCardHTML(item)).join('');
    }

    handleFilter();
    updateFavBadges();
}

// ----------------------------------------------------------------------------
// 5. BÚSQUEDA Y FILTRADO
// ----------------------------------------------------------------------------
/**
 * Filtra el listado de noticias según el término de búsqueda y categoría seleccionada.
 */

///
function handleFilter() {
    const newsContainer = document.getElementById('all-news-grid');
    const categoriesContainer = document.getElementById('categories-news-grid');
    if (!newsContainer && !categoriesContainer) return;

    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryTerm = document.getElementById('category-filter')?.value || 'ALL';

    let filtered = newsData.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm) || item.excerpt.toLowerCase().includes(searchTerm);
        const matchesCategory = (categoryTerm === 'ALL') || (item.category === categoryTerm);
        const matchesFavs = !showFavoritesOnly || favorites.includes(item.id);
        return matchesSearch && matchesCategory && matchesFavs;
    });

    const contentHtml = filtered.length === 0 ? `
        <div class="col-span-full text-center py-12 text-gray-500 space-y-3">
            <i class="far fa-newspaper text-4xl text-gray-300"></i>
            <p class="text-lg font-medium">No se encontraron noticias que coincidan con la búsqueda.</p>
        </div>
    ` : filtered.map(item => renderCardHTML(item)).join('');

    if (newsContainer) newsContainer.innerHTML = contentHtml;
    if (categoriesContainer) categoriesContainer.innerHTML = contentHtml;
}

////


/**
 * Selecciona una categoría y navega al listado.
 * @param {string} category 
 */
function filterByCategory(category) {
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) categorySelect.value = category;
    navigateTo('categories');
}

// ----------------------------------------------------------------------------
// 6. GESTIÓN DE FAVORITOS (LOCALSTORAGE)
// ----------------------------------------------------------------------------
/**
 * Agrega o elimina una noticia de la lista de favoritos.
 * @param {number} id 
 */
function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('informanews_favs', JSON.stringify(favorites));
    renderAllGrids();
    updateDetailFavButton();
}

/**
 * Actualiza el indicador visual de conteo de favoritos en el Header.
 */
function updateFavBadges() {
    const count = favorites.length;
    const badge = document.getElementById('fav-count-badge');
    const icon = document.getElementById('fav-counter-icon');
    if (badge && icon) {
        if (count > 0) {
            badge.innerText = count;
            badge.classList.remove('hidden');
            icon.className = 'fas fa-heart text-xs text-red-500';
        } else {
            badge.classList.add('hidden');
            icon.className = 'far fa-heart text-xs';
        }
    }
}

// ----------------------------------------------------------------------------
// 7. VISTA DETALLE
// ----------------------------------------------------------------------------
/**
 * Carga e inyecta la información de la noticia seleccionada.
 * @param {number} id 
 */
function openNewsDetail(id) {
    currentDetailId = id;
    const item = newsData.find(n => n.id === id);
    if (!item) return;

    document.getElementById('detail-category').innerText = item.category;
    document.getElementById('detail-title').innerText = item.title;
    document.getElementById('detail-meta').innerText = item.date;
    document.getElementById('detail-image').src = item.image;

    const bodyContainer = document.getElementById('detail-body');
    bodyContainer.innerHTML = item.body.map((p, idx) => `
        <p class="${idx === 0 ? 'font-semibold text-gray-900 text-xl' : ''}">${p}</p>
    `).join('');

    updateDetailFavButton();
    navigateTo('detail');
}

/**
 * Actualiza la apariencia del botón de favorito en la vista detalle.
 */
function updateDetailFavButton() {
    const isFav = favorites.includes(currentDetailId);
    const icon = document.getElementById('detail-fav-icon');
    const text = document.getElementById('detail-fav-text');
    const btn = document.getElementById('detail-fav-btn');

    if (icon && text && btn) {
        if (isFav) {
            icon.className = "fas fa-heart text-red-400";
            text.innerText = "Quitar de favoritos";
            btn.className = "w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 px-6 rounded-xl shadow transition-all flex items-center justify-center gap-2";
        } else {
            icon.className = "far fa-heart";
            text.innerText = "Agregar a favoritos";
            btn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow transition-all flex items-center justify-center gap-2";
        }
    }
}

function toggleDetailFavorite() {
    toggleFavorite(currentDetailId);
}

// ----------------------------------------------------------------------------
// 8. VALIDACIONES DEL FORMULARIO DE CONTACTO EN TIEMPO REAL
// ----------------------------------------------------------------------------
/**
 * Evalúa las reglas del formulario y muestra errores/aciertos en el panel lateral.
 * @returns {boolean} Es válido o no.
 */
function validateFormLive() {
    const name = document.getElementById('input-name').value.trim();
    const email = document.getElementById('input-email').value.trim();
    const subject = document.getElementById('input-subject').value.trim();
    const message = document.getElementById('input-message').value.trim();
    const valBox = document.getElementById('validation-box');

    let errors = [];
    let validList = [];

    // Validar Nombre
    if (!name) errors.push("Nombre completo es obligatorio.");
    else validList.push("Nombre ingresado.");

    // Validar Correo Electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) errors.push("Correo electrónico es obligatorio.");
    else if (!emailRegex.test(email)) errors.push("Correo electrónico no tiene un formato válido.");
    else validList.push("Correo válido.");

    // Validar Asunto
    if (!subject) errors.push("Asunto es obligatorio.");
    else validList.push("Asunto completado.");

    // Validar Mensaje
    if (!message) errors.push("Mensaje es obligatorio.");
    else validList.push("Mensaje redactado.");

    let html = '';

    if (errors.length > 0) {
        html += `<div class="space-y-1 mb-2">`;
        errors.forEach(err => {
            html += `<p class="text-red-600 font-medium text-xs flex items-center gap-1.5"><i class="fas fa-exclamation-circle"></i> ${err}</p>`;
        });
        html += `</div>`;
    }

    if (validList.length > 0) {
        html += `<div class="space-y-1 pt-1 border-t border-blue-100">`;
        validList.forEach(item => {
            html += `<p class="text-emerald-600 font-medium text-xs flex items-center gap-1.5"><i class="fas fa-check-circle"></i> ${item}</p>`;
        });
        html += `</div>`;
    }

    valBox.innerHTML = html || `
        <p class="text-gray-500 flex items-center gap-2">
            <i class="fas fa-info-circle text-blue-500"></i> Complete los campos marcados con (*) para enviar su mensaje.
        </p>
    `;

    return errors.length === 0;
}

/**
 * Maneja el envío final del formulario de contacto.
 * @param {Event} event 
 */
function submitForm(event) {
    event.preventDefault();
    const isValid = validateFormLive();
    const valBox = document.getElementById('validation-box');

    if (isValid) {
        valBox.innerHTML = `
            <div class="bg-emerald-100 text-emerald-800 p-4 rounded-xl space-y-2">
                <p class="font-bold flex items-center gap-2 text-sm"><i class="fas fa-paper-plane"></i> ¡Mensaje Enviado!</p>
                <p class="text-xs">Gracias por contactarnos. Nos pondremos en contacto contigo pronto.</p>
            </div>
        `;
        document.getElementById('contact-form').reset();
    } else {
        valBox.innerHTML += `
            <p class="text-red-700 font-bold text-xs mt-2"><i class="fas fa-[#e11d48]"></i> Por favor corrige los errores resaltados arriba.</p>
        `;
    }
}

// ----------------------------------------------------------------------------
// 9. INICIALIZACIÓN
// ----------------------------------------------------------------------------
window.onload = function() {
    loadDataFromJSON(); // Inicializa mediante lectura asíncrona del JSON
};
