const SpacedRepetition = {
    // Secuencia Fibonacci (en días)
    fibonacciDays: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55],

    // Guardar frase como dominada
    markAsMastered(phraseId, lang) {
        const key = `mastered_${phraseId}_${lang}`;
        const today = new Date().toISOString().slice(0, 10);
        
        localStorage.setItem(key, JSON.stringify({
            phraseId,
            lang,
            masteredDate: today,
            nextReview: this.getNextReviewDate(0),
            reviewLevel: 0
        }));
    },

    // Obtener fecha del próximo repaso
    getNextReviewDate(reviewLevel) {
        const days = this.fibonacciDays[reviewLevel] || 55;
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
    },

    // Obtener frases para repasar hoy (incluye repasos ATRASADOS)
    getReviewsForToday() {
        const today = new Date().toISOString().slice(0, 10);
        const reviews = [];

        // Buscar en localStorage todas las frases dominadas
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('mastered_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    // ✅ FIX: <= en vez de === para no perder repasos
                    // si el usuario no abrió el app justo ese día
                    if (data && data.nextReview <= today) {
                        reviews.push(data);
                    }
                } catch (e) {
                    console.warn('⚠️ Entrada corrupta en localStorage:', key);
                }
            }
        }

        return reviews;
    },

    // Completar un repaso
    completeReview(phraseId, lang) {
        const key = `mastered_${phraseId}_${lang}`;
        const raw = localStorage.getItem(key);
        if (!raw) {
            console.warn(`⚠️ No existe registro para ${key}`);
            return;
        }
        const data = JSON.parse(raw);

        data.reviewLevel = (data.reviewLevel || 0) + 1;
        data.nextReview = this.getNextReviewDate(data.reviewLevel);

        localStorage.setItem(key, JSON.stringify(data));
    },

    // Mostrar notificación de repasos
    showReviewNotification() {
        const reviews = this.getReviewsForToday();
        if (reviews.length > 0) {
            console.log(`📚 Tienes ${reviews.length} frase(s) para repasar hoy`);
            // TODO: Mostrar como alert o modal en la UI
            return reviews;
        }
        return [];
    }
};
