const btn = document.getElementById('btn-listen');
const signOutput = document.getElementById('sign-output');
const faceOutput = document.getElementById('facial-expression');
const preview = document.getElementById('text-preview');
const container = document.querySelector('.app-container');
const btnText = btn.querySelector('.btn-text');

let diccionario = {};
let alfabeto = {};

// Cargar el diccionario desde el JSON externo
fetch('diccionario_lsa.json')
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
        btnText.innerText = "Escuchando...";
        preview.innerText = "Escuchando...";
        preview.classList.remove('empty');
        faceOutput.innerText = "😮";
    };

    recognition.onend = () => {
        isListening = false;
        isProcessing = false;
        document.body.classList.remove('listening');
        btnText.innerText = "Empezar a Escuchar";
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
        btnText.innerText = "Empezar a Escuchar";
    };
}

// 3. Lógica de Traducción
function procesarMensaje(texto) {
    signOutput.innerHTML = ""; 
    const avatarContent = document.getElementById('avatar-display');
    
    // Cambiar cara según el tono
    if (texto.includes("donde") || texto.includes("que") || texto.includes("como") || texto.includes("cuándo")) {
        faceOutput.innerText = "🤨";
    } else if (texto.includes("feliz") || texto.includes("gracias") || texto.includes("bien")) {
        faceOutput.innerText = "😊";
    } else if (texto.includes("triste") || texto.includes("mal")) {
        faceOutput.innerText = "😔";
    } else {
        faceOutput.innerText = "🙂";
    }

    const palabras = texto.split(/\s+/);

    palabras.forEach((palabra) => {
        const limpia = palabra.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        
        if (diccionario[limpia]) {
            mostrarConceptoAvatar(diccionario[limpia], limpia);
        } else if (limpia.length > 0) {
            mostrarPalabraDactilologica(limpia);
        }
    });
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

function mostrarPalabraDactilologica(palabra) {
    const palabraNormalizada = palabra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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

        signOutput.appendChild(card);
        
        // Scroll automático hacia la derecha
        signOutput.scrollLeft = signOutput.scrollWidth;
    });
}