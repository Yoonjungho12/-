export function getCurrentDate() {
    const newDate = new Date();
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    const h = String(newDate.getHours()).padStart(2, '0');
    const min = String(newDate.getMinutes()).padStart(2, '0');
    const s = String(newDate.getSeconds()).padStart(2, '0');

    return `${y}${m}${d}${h}${min}${s}`;
} 