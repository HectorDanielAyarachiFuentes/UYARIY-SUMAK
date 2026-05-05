const btn = document.getElementById('btn-listen');
const signOutput = document.getElementById('sign-output');
const faceOutput = document.getElementById('facial-expression');
const preview = document.getElementById('text-preview');
const container = document.querySelector('.app-container');
const micIcon = btn.querySelector('.mic-icon');

function actualizarEmojiRostro(emoji) {
    if (!faceOutput) return;
    const faceChar = faceOutput.querySelector('.face-char');
    if (faceChar) {
        faceChar.innerText = emoji;
    } else {
        faceOutput.innerText = emoji;
    }
}

let diccionario = {};
let alfabeto = {};

// Cargar el diccionario desde el JSON externo
fetch('data/diccionario_lsa.json')
    .then(response => response.json())
    .then(data => {
        diccionario = data.conceptos;
        alfabeto = data.alfabeto;
        console.log("Diccionario LSA cargado correctamente.");
    })
    .catch(error => console.error("Error al cargar el diccionario:", error));

// --- Manejo del Selector de Idioma ---
const selectorWrapper = document.querySelector('.selector-wrapper');
selectorWrapper.onclick = (e) => {
    e.stopPropagation();
    selectorWrapper.classList.toggle('active');
};

document.onclick = () => {
    selectorWrapper.classList.remove('active');
};

// --- Configurar Reconocimiento de Voz ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Lo siento, tu navegador no soporta el reconocimiento de voz. Por favor usa Google Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.continuous = false;

    let isListening = false;
    let isProcessing = false;

    btn.onclick = () => {
        if (isProcessing) return; 

        if (!isListening) {
            try {
                isProcessing = true;
                recognition.start();
            } catch (e) {
                console.error("Recognition error:", e);
                isProcessing = false;
            }
        } else {
            isProcessing = true;
            recognition.stop();
        }
    };

    recognition.onstart = () => {
        isListening = true;
        isProcessing = false;
        document.body.classList.add('listening');
        micIcon.innerText = "⏹️";
        btn.title = "Detener Escucha";
        preview.innerText = "Escuchando...";
        preview.classList.remove('empty');
        
        // Activar estado de escucha animado
        faceOutput.classList.remove('typing');
        faceOutput.classList.add('listening');
        actualizarEmojiRostro("😮");
    };

    recognition.onend = () => {
        isListening = false;
        isProcessing = false;
        document.body.classList.remove('listening');
        micIcon.innerText = "🎤";
        btn.title = "Empezar a Escuchar";
        
        // Quitar estado de escucha animado
        faceOutput.classList.remove('listening');
        actualizarEmojiRostro("🙂");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        preview.innerText = `Escuché: "${transcript}"`;
        procesarMensaje(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        preview.innerText = "Error al escuchar: " + event.error;
        document.body.classList.remove('listening');
        isListening = false;
        isProcessing = false;
        micIcon.innerText = "🎤";
        btn.title = "Empezar a Escuchar";
        
        // Quitar estado en caso de error
        faceOutput.classList.remove('listening');
        actualizarEmojiRostro("😐");
    };
}

// --- Lógica de Traducción por Texto ---
const textInput = document.getElementById('text-input');
const btnTranslate = document.getElementById('btn-translate');
let typingTimeout;

function traducirTextoIngresado() {
    const texto = textInput.value.trim();
    if (texto.length > 0) {
        preview.innerText = `Traducido: "${texto}"`;
        preview.classList.remove('empty');
        
        // Quitar estado de escritura inmediatamente
        clearTimeout(typingTimeout);
        faceOutput.classList.remove('typing');
        
        procesarMensaje(texto);
        textInput.value = ""; // Limpiar input después de traducir
    }
}

if (btnTranslate && textInput) {
    btnTranslate.onclick = traducirTextoIngresado;
    
    let alternateHandLeft = true;
    textInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            traducirTextoIngresado();
            return;
        }

        // Teclas que ignoramos para no activar golpe de teclado físico
        const ignoreKeys = ['Shift', 'Control', 'Alt', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'CapsLock', 'Tab'];
        if (ignoreKeys.includes(e.key)) return;

        // Activar estado escribiendo si no está activo ya
        faceOutput.classList.remove('listening');
        faceOutput.classList.add('typing');
        actualizarEmojiRostro("🧐");

        // Conseguir referencias internas de manos y teclado
        const handLeft = faceOutput.querySelector('.hand-left');
        const handRight = faceOutput.querySelector('.hand-right');
        const keyboard = faceOutput.querySelector('.keyboard-icon');

        // Alternar mano en cada pulsación (incluidos espacios!)
        if (alternateHandLeft) {
            if (handLeft) {
                handLeft.classList.remove('tapped');
                void handLeft.offsetWidth; // Trigger reflow
                handLeft.classList.add('tapped');
            }
        } else {
            if (handRight) {
                handRight.classList.remove('tapped');
                void handRight.offsetWidth; // Trigger reflow
                handRight.classList.add('tapped');
            }
        }

        // Animación elástica del teclado (Squash)
        if (keyboard) {
            keyboard.classList.remove('tapped');
            void keyboard.offsetWidth; // Trigger reflow
            keyboard.classList.add('tapped');
        }

        // Alternar bandera
        alternateHandLeft = !alternateHandLeft;

        // Reiniciar el temporizador de inactividad
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            faceOutput.classList.remove('typing');
            actualizarEmojiRostro("🙂");
        }, 2000);
    };

    // Listeners de estado de escritura para animar el rostro avatar
    textInput.addEventListener('focus', () => {
        faceOutput.classList.remove('listening');
        faceOutput.classList.add('typing');
        actualizarEmojiRostro("🧐");
    });
    
    textInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== textInput) {
                faceOutput.classList.remove('typing');
                actualizarEmojiRostro("🙂");
            }
        }, 500);
    });
}

// 3. Lógica de Traducción
function procesarMensaje(texto) {
    signOutput.innerHTML = ""; 
    const avatarContent = document.getElementById('avatar-display');
    
    // Cambiar cara según el tono usando el actualizador de rostro seguro
    if (texto.includes("donde") || texto.includes("que") || texto.includes("como") || texto.includes("cuándo")) {
        actualizarEmojiRostro("🤨");
    } else if (texto.includes("feliz") || texto.includes("gracias") || texto.includes("bien")) {
        actualizarEmojiRostro("😊");
    } else if (texto.includes("triste") || texto.includes("mal")) {
        actualizarEmojiRostro("😔");
    } else {
        actualizarEmojiRostro("🙂");
    }

    const palabras = texto.split(/\s+/);
    let firstWord = true;

    palabras.forEach((palabra) => {
        const limpia = palabra.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        // Normalizar la palabra para ignorar mayúsculas y acentos al buscar en el diccionario (ej: "mamá" -> "mama")
        const limpiaNormalizada = limpia
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        
        if (diccionario[limpiaNormalizada]) {
            if (!firstWord) {
                agregarEspacioEntrePalabras();
            }
            mostrarConceptoAvatar(diccionario[limpiaNormalizada], limpia);
            mostrarConceptoCard(diccionario[limpiaNormalizada], limpia);
            firstWord = false;
        } else if (limpia.length > 0) {
            if (!firstWord) {
                agregarEspacioEntrePalabras();
            }
            mostrarPalabraDactilologica(limpia);
            firstWord = false;
        }
    });
}

function agregarEspacioEntrePalabras() {
    const spacer = document.createElement("div");
    spacer.className = "word-spacer";
    signOutput.appendChild(spacer);
}

function mostrarConceptoAvatar(simbolo, palabra) {
    const avatarContent = document.getElementById('avatar-display');
    avatarContent.innerHTML = `
        <div class="concept-viz">
            <span class="concept-emoji">${simbolo}</span>
            <span class="concept-label">${palabra}</span>
        </div>
    `;
    // Limpiar después de 3 segundos para que vuelva el avatar por defecto
    setTimeout(() => {
        avatarContent.innerHTML = '<div class="avatar-placeholder"><div class="face-mesh"></div></div>';
    }, 3000);
}

function crearTarjetaDactilologica(token, palabra) {
    const card = document.createElement("div");
    card.className = "dact-card";
    
    const cardImgArea = document.createElement("div");
    cardImgArea.className = "card-img-area";

    if (alfabeto[token.base]) {
        const img = document.createElement("img");
        img.src = alfabeto[token.base];
        img.alt = token.original;
        img.className = "card-img";
        
        img.onerror = () => {
            img.remove();
            const fallbackText = document.createElement("div");
            fallbackText.className = "card-letter-fallback";
            fallbackText.innerText = token.original.toUpperCase();
            cardImgArea.appendChild(fallbackText);
        };
        cardImgArea.appendChild(img);
    } else {
        const fallbackText = document.createElement("div");
        fallbackText.className = "card-letter-fallback";
        fallbackText.innerText = token.original.toUpperCase();
        cardImgArea.appendChild(fallbackText);
    }

    card.appendChild(cardImgArea);

    const letterDiv = document.createElement("div");
    letterDiv.className = "card-letter";
    letterDiv.innerText = token.original.toUpperCase();
    card.appendChild(letterDiv);

    const wordRef = document.createElement("div");
    wordRef.className = "card-word-ref";
    wordRef.innerText = palabra;
    card.appendChild(wordRef);

    // Doble click para abrir modal de zoom de accesibilidad completo
    card.ondblclick = () => {
        abrirModalAccesibilidadCompleto();
    };

    return card;
}

function mostrarConceptoCard(simbolo, palabra) {
    const wrapper = document.createElement("div");
    wrapper.className = "concept-wrapper";
    
    const card = document.createElement("div");
    card.className = "dact-card concept-card";
    card.title = "Clic para ver deletreo dactilológico";
    
    const cardImgArea = document.createElement("div");
    cardImgArea.className = "card-img-area";
    
    const emojiSpan = document.createElement("span");
    emojiSpan.className = "card-concept-emoji";
    emojiSpan.innerText = simbolo;
    cardImgArea.appendChild(emojiSpan);
    
    card.appendChild(cardImgArea);
    
    const letterDiv = document.createElement("div");
    letterDiv.className = "card-letter concept-title";
    letterDiv.innerText = palabra.toUpperCase();
    card.appendChild(letterDiv);
    
    const wordRef = document.createElement("div");
    wordRef.className = "card-word-ref";
    wordRef.innerText = palabra;
    card.appendChild(wordRef);
    
    // Crear el badge de deletreo
    const badge = document.createElement("div");
    badge.className = "spell-badge";
    badge.innerText = "🔍 Deletrear";
    card.appendChild(badge);
    
    wrapper.appendChild(card);
    
    // Crear el contenedor de deletreo dactilológico
    const inlineSpelling = document.createElement("div");
    inlineSpelling.className = "inline-spelling";
    
    // Generar las letras dactilológicas para esta palabra
    const palabraNormalizada = palabra
        .normalize("NFC")
        .split('')
        .map(char => {
            if (char.toLowerCase() === 'ñ') return 'ñ';
            return char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        })
        .join('');

    let i = 0;
    const tokens = [];
    while (i < palabra.length) {
        if (palabra.substring(i, i + 2).toLowerCase() === "ch") {
            tokens.push({ original: "ch", base: "ch" });
            i += 2;
        } else {
            tokens.push({ original: palabra[i], base: palabraNormalizada[i] });
            i++;
        }
    }

    tokens.forEach((token) => {
        const letterCard = crearTarjetaDactilologica(token, palabra);
        inlineSpelling.appendChild(letterCard);
    });
    
    wrapper.appendChild(inlineSpelling);
    
    // Añadir interactividad al hacer clic
    card.onclick = () => {
        const isExpanded = wrapper.classList.toggle("expanded");
        badge.innerText = isExpanded ? "❌ Cerrar" : "🔍 Deletrear";
        
        // Auto-scroll para centrar las nuevas tarjetas si se despliegan
        if (isExpanded) {
            setTimeout(() => {
                wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }, 150);
        }
    };

    // Doble click para abrir modal de zoom de accesibilidad completo
    card.ondblclick = (e) => {
        e.stopPropagation(); // Evitar que dispare la expansión simple
        abrirModalAccesibilidadCompleto();
    };
    
    signOutput.appendChild(wrapper);
    
    // Scroll automático hacia la derecha
    signOutput.scrollLeft = signOutput.scrollWidth;
}

function mostrarPalabraDactilologica(palabra) {
    // Normalizar conservando la letra 'ñ' y 'Ñ' que tienen su propia representación
    const palabraNormalizada = palabra
        .normalize("NFC")
        .split('')
        .map(char => {
            if (char.toLowerCase() === 'ñ') return 'ñ';
            return char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        })
        .join('');

    let i = 0;
    const tokens = [];
    while (i < palabra.length) {
        if (palabra.substring(i, i + 2).toLowerCase() === "ch") {
            tokens.push({ original: "ch", base: "ch" });
            i += 2;
        } else {
            tokens.push({ original: palabra[i], base: palabraNormalizada[i] });
            i++;
        }
    }

    tokens.forEach((token) => {
        const card = crearTarjetaDactilologica(token, palabra);
        signOutput.appendChild(card);
    });
    
    // Scroll automático hacia la derecha
    signOutput.scrollLeft = signOutput.scrollWidth;
}

// --- Modal de Accesibilidad (Súper Zoom de Traducción Completa) ---
function abrirModalAccesibilidadCompleto() {
    const modal = document.getElementById('image-modal');
    const giantOutput = document.getElementById('modal-giant-output');
    
    // Limpiar contenido previo
    giantOutput.innerHTML = "";
    
    // Clonar todos los elementos hijos de signOutput
    const originalChildren = signOutput.children;
    
    // Validar si no hay elementos o solo está el mensaje por defecto
    if (originalChildren.length === 0 || (originalChildren.length === 1 && originalChildren[0].classList.contains('placeholder-msg'))) {
        return; // No hay traducciones para ampliar
    }
    
    Array.from(originalChildren).forEach((child) => {
        const clone = child.cloneNode(true);
        
        // Quitar eventos de doble click para evitar recursión al clonar
        clone.ondblclick = null;
        const subCards = clone.querySelectorAll('.dact-card');
        subCards.forEach(sub => {
            sub.ondblclick = null;
        });
        
        // Conservar funcionalidad de colapsar/expandir en tarjetas de conceptos clonadas dentro del modal
        const conceptCard = clone.querySelector('.concept-card');
        if (conceptCard) {
            const badge = clone.querySelector('.spell-badge');
            conceptCard.onclick = () => {
                const isExpanded = clone.classList.toggle("expanded");
                if (badge) {
                    badge.innerText = isExpanded ? "❌ Cerrar" : "🔍 Deletrear";
                }
            };
        }
        
        giantOutput.appendChild(clone);
    });
    
    modal.classList.add('active');
}

// Escuchar doble click en todo el contenedor de traducción para abrir el zoom gigante
if (signOutput) {
    signOutput.ondblclick = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        abrirModalAccesibilidadCompleto();
    };
}

// --- Control del Modal de Accesibilidad ---
const modalElement = document.getElementById('image-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBackdrop = document.querySelector('.image-modal .modal-backdrop');

if (modalCloseBtn && modalBackdrop) {
    const cerrarModal = () => {
        modalElement.classList.remove('active');
    };
    modalCloseBtn.onclick = cerrarModal;
    modalBackdrop.onclick = cerrarModal;
    
    // Cerrar con Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });
}