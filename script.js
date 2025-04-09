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

function confirmBooking() {
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const confirmation = document.getElementById("confirmation");

    if (name && phone && date && time) {
        const [year, month, day] = date.split("-");
        const formattedDate = `${day}/${month}/${year}`;
        confirmation.textContent = `Agendamento confirmado para ${name} no dia ${formattedDate} às ${time}.`;
        confirmation.style.color = 'green';
    } else {
        confirmation.textContent = "Por favor, preencha todos os campos.";
        confirmation.style.color = 'red';
    }
};
function confirmBooking() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    if (!name || !phone || !date || !time) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const message = `Olá, meu nome é *${name}*.\nGostaria de agendar um horário para o dia *${date}* às *${time}*.\nMeu telefone é: *${phone}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = "5586995311133"; // substitua pelo número correto da Andreya Cabelos
    const url = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(url, '_blank');
  }
