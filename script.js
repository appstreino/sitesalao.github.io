// Dias que o salão estará aberto (formato DD/MM/AAAA)
const availableDates = [
    "10/04/2025",
    "12/04/2025",
    "15/04/2025",
    "18/04/2025"
];

const dateSelect = document.getElementById("date");
availableDates.forEach(dateStr => {
    // Converter de DD/MM/AAAA para AAAA-MM-DD (valor do input)
    const [day, month, year] = dateStr.split("/");
    const isoDate = `${year}-${month}-${day}`;

    const option = document.createElement("option");
    option.value = isoDate;
    option.textContent = dateStr;
    dateSelect.appendChild(option);
});

// Aplicar máscara ao telefone
const phoneInput = document.getElementById("phone");
phoneInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d{5})(\d{1,4})$/, "$1-$2");
    e.target.value = value;
});

function confirmBooking() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const dateInput = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    if (!name || !phone || !dateInput || !time) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Converter a data para o formato brasileiro
    const date = new Date(dateInput + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('pt-BR');

    const message = `Olá, meu nome é *${name}*.
Gostaria de agendar um horário para o dia *${formattedDate}* às *${time}*.
Meu telefone é: *${phone}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = "5586995311133"; // Substitua pelo número real
    const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(url, '_blank');
}
