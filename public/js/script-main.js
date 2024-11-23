let currentIndex = 0;
let currentKnowCount = 0;
let currentDontKnowCount = 0;
const cards = document.querySelectorAll('.q-card');

function showCard(index) {
  cards[currentIndex].classList.remove('active');
  currentIndex = index;
  cards[currentIndex].classList.add('active');
  updateButtons();
}

function showNextY() {
  const knowCountElement = document.getElementById('knowCount');
  currentKnowCount++;
  knowCountElement.textContent = currentKnowCount;
  if (currentIndex < cards.length - 1) {
    showCard(currentIndex + 1);
  }
}

function showNextN() {
  const dontKnowCountElement = document.getElementById('dontKnowCount');
  currentDontKnowCount++;
  dontKnowCountElement.textContent = currentDontKnowCount;
  if (currentIndex < cards.length - 1) {
    showCard(currentIndex + 1);
  }
}

function showPrev() {
  if (currentIndex > 0) {
    showCard(currentIndex - 1);
  }
}

function showShareLink(questionId) {
  // Construct the shareable link
  const baseURL = 'https://qtutor.onrender.com/jiggasa?id=';
  const shareableLink = `${baseURL}${questionId}`;

  // Copy the link to the clipboard
  navigator.clipboard.writeText(shareableLink)
    .then(() => {
      alert('Link copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });

  // Prevent default link behavior
  return false;
}
