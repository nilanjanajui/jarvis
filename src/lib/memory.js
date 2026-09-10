// Local fact memory storage for persistent context retrieval across sessions
const MEMORY_KEY = 'jarvis-retained-facts';

export function getStoredFacts() {
    if (typeof window === 'undefined') return [];
    try {
        const saved = localStorage.getItem(MEMORY_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load memory facts:', e);
        return [];
    }
}

export function saveFact(factText) {
    if (typeof window === 'undefined' || !factText) return;
    try {
        const facts = getStoredFacts();
        const exists = facts.some(f => f.text === factText);
        if (!exists) {
            const updated = [...facts, { id: Date.now(), text: factText, date: new Date().toLocaleDateString() }];
            localStorage.setItem(MEMORY_KEY, JSON.stringify(updated.slice(-50)));
        }
    } catch (e) {
        console.error('Failed to save memory fact:', e);
    }
}

export function getRelevantFactsPrompt(userQuery = '') {
    const facts = getStoredFacts();
    if (!facts.length) return '';

    const queryLower = userQuery.toLowerCase();
    const relevant = facts.filter(f => {
        const words = f.text.toLowerCase().split(/\s+/);
        return words.some(w => w.length > 3 && queryLower.includes(w)) || facts.length <= 5;
    });

    if (!relevant.length) return '';
    return 'RETAINED USER FACTS & PREFERENCES:\n' + relevant.map(f => `- ${f.text}`).join('\n');
}
