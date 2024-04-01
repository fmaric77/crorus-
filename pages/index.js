import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
export default function Home() {
  const [words, setWords] = useState(new Set());
  const [ffWords, setFfWords] = useState(new Set());
  const [restricted, setRestrictedWords] = useState(new Set());
  const [input, setInput] = useState('');
  const [theme, setTheme] = useState('light'); // initially set to 'light'
  const output = useMemo(() => generateOutput(input, words, ffWords, restricted), [input, words, ffWords,restricted]);
  const intelligibility = useMemo(() => calculateIntelligibility(input, words, ffWords,restricted), [input, words, ffWords,restricted]);
  const isWordInSet = require('./wordCheck');

  // Fetch the words from the server
  useEffect(() => {  
      const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light';
      setTheme(storedTheme || 'light');
    document.body.className = '';
    document.title = "MOST";
    document.body.classList.add(theme);
    axios.get('/api/words')
      .then(function (response) {
        // Add each word to the set
        const wordsSet = new Set(response.data);
        setWords(wordsSet);
      })
      .catch(function (error) {
        console.log(error);
      });

    // Fetch the ff words
    axios.get('/api/ff')
      .then(function (response) {
        // Add each word to the set
        const ffWordsSet = new Set(response.data);
        setFfWords(ffWordsSet);
      })
      .catch(function (error) {
        console.log(error);
      });

       // Fetch the ff words



  }, [theme]);

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  
  };
function saveToPdf() {
  const outputElement = document.getElementById('output'); // Get the output element

  html2canvas(outputElement).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
    });

    const imgProps= pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('output.pdf');
  });
}
const [showPopup, setShowPopup] = useState(false);
const togglePopup = () => {
  setShowPopup(!showPopup);
};

  return (
    <div>
          <h3 id='most'>MOST 1.0</h3>
<button onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀'}</button>
          <button onClick={saveToPdf}>Save to PDF</button>
          <button onClick={togglePopup}>?</button>
          {showPopup && (
  <div id="popup">
    <p>Aplikacija MOST provjerava razumljivost štokavski - ruski u pismenom obliku. Riječi razumljive i štokavcima i rusima označene su zeleno a nerazumljive crveno. </p>
    <p>Приложение МОСТ проверяет разборчивость штокавского и русского языков в письменной форме. Слова, понятные как штокавцев, так и русским, отмечены зеленым цветом, а непонятные – красным.В русском алфавите есть дополнительные буквы, которые могут сделать слова неразборчивыми. Используйте Гайицу или Вуковицу. </p>
    <button onClick={togglePopup}>Zatvorit</button>
  </div>
)}


<span id='lp' style={{ color: 'purple', marginLeft: '10px' }}>
      &#9679; lažni prijatelj
    </span>

      <textarea value={input} onChange={handleInputChange} />
      <div id="output">{output}</div>
      <div>Intelligibility: {intelligibility}%</div>
    </div>
  );
}

// Mapping of Cyrillic characters to Latin
const cyrillicToLatin = {
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Đ', 'Е': 'E', 'Ж': 'Ž', 'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj', 'М': 'M', 'Н': 'N', 'Њ': 'Nj', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'Ć', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Č', 'Џ': 'Dž', 'Ш': 'Š',
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'đ', 'е': 'e', 'ж': 'ž', 'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'ć', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'č', 'џ': 'dž', 'ш': 'š'
};

function transliterateCyrillicToLatin(word) {
  return Array.from(word).map(char => cyrillicToLatin[char] || char).join('');
}


function isWordInSet(word, words) {
  word = word.replace(/['"]/g, ''); // Remove single and double quotes from the word
  const latinWord = transliterateCyrillicToLatin(word);

  if (words.has(word) || words.has(latinWord)) {
    return true;
  }

  // Helper function to remove a character at a specific index and check if the resulting word is in the set
  function checkWithoutCharAt(index) {
    const wordWithoutChar = word.slice(0, index) + word.slice(index + 1);
    const latinWordWithoutChar = latinWord.slice(0, index) + latinWord.slice(index + 1);
    return words.has(wordWithoutChar) || words.has(latinWordWithoutChar);
  }

  // Check if removing a 'j' from the word or its transliteration results in a word that's in the set
  if (Array.from(word).some((char, index) => char === 'j' && checkWithoutCharAt(index))) {
    return true;
  }

  // Check if adding a 'j' before 'e' in the word or its transliteration results in a word that's in the set
  if (Array.from(word).some((char, index) => char === 'e' && checkWithoutCharAt(index - 1))) {
    return true;
  }

  // Check if removing the last character from the word or its transliteration results in a word that's in the set
  if (checkWithoutCharAt(word.length - 1)) {
    return true;
  }

  // Check if replacing the last character with 'a', 'e', 'i', 'o', or 'u' results in a word that's in the set
  const vowels = ['a', 'e', 'i', 'o', 'u', 'j'];
  if (vowels.some(vowel => words.has(word.slice(0, -1) + vowel) || words.has(latinWord.slice(0, -1) + vowel))) {
    return true;
  }

  // Check if adding 'a', 'e', 'i', 'o', 'u', or 'j' to the end of the word or its transliteration results in a word that's in the set
  if (vowels.some(vowel => words.has(word + vowel) || words.has(latinWord + vowel))) {
    return true;
  }

  // Check if removing 'j' from the end of the word or its transliteration results in a word that's in the set
  if ((word[word.length - 1] === 'j' || latinWord[latinWord.length - 1] === 'j') && checkWithoutCharAt(word.length - 1)) {
    return true;
  }

  // Check if the word ends with 'ja' and if removing it results in a word that's in the set
  if ((word.endsWith('ja') || latinWord.endsWith('ja')) && checkWithoutCharAt(word.length - 2)) {
    return true;
  }

  // Check if the word ends with 'ami' or 'ima' and if removing it results in a word that's in the set
if ((word.endsWith('ami') || word.endsWith('ima')) && words.has(word.slice(0, -3))) {
  return true;
}

// Check if the transliterated word ends with 'ami' or 'ima' and if removing it results in a word that's in the set
if ((latinWord.endsWith('ami') || latinWord.endsWith('ima')) && words.has(latinWord.slice(0, -3))) {
  return true;
}




// Define special characters
const specialCharacters = ['!',"“", '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '{', '}', '[', ']', '|', ':', ';', ',', '.', '<', '>', '?', '/','“','”','“', ':', ',', '!', ';', '?'];

// Create a regular expression from the specialCharacters array
const specialCharactersRegex = new RegExp('[' + specialCharacters.join('\\') + ']', 'g');

// Remove all special characters from the word and its transliteration
const wordWithoutSpecialCharacters = word.replace(specialCharactersRegex, '');
const latinWordWithoutSpecialCharacters = latinWord.replace(specialCharactersRegex, '');

// Check if the word without special characters or its transliteration is in the set
if (words.has(wordWithoutSpecialCharacters) || words.has(latinWordWithoutSpecialCharacters)) {
  return true;
}



  return false;
}

function isWordInFfSet(word, ffWords) {
  // Check if the word or a part of it is in the ff words set
  for (let i = 0; i < word.length; i++) {
    for (let j = i + 1; j <= word.length; j++) {
      const slice = word.slice(i, j);
      if ((slice === 'mir' && word === 'mir') || 
      (slice === 'pora' && word === 'pora') || 
      (slice === 'para' && word === 'para') || 
      (slice === 'obraz' && word === 'obraz') || 
      (slice === 'ako' && word === 'ako') ||
      (slice === 'onom' && word === 'onom') ||
      (slice === 'onaj' && word === 'onaj') ||
      (slice === 'onu' && word === 'onu') ||
      (slice === 'kod' && word === 'kod') ||
      (slice === 'ova' && word === 'ova') ||
      (slice === 'ova' && word === 'ovo') ||
      (slice === 'ovaj' && word === 'ovaj') ||

      (slice === 'jako' && word === 'jako')) {
    return true;
  }
  if (slice !== 'mir' && slice !== 'kod'  && slice !== 'ovaj'  && slice !== 'ovo'  && slice !== 'ova' && slice !== 'pora' && slice !== 'para' && slice !== 'obraz' && slice !== 'ako' && slice !== 'onom' && slice !== 'onaj' && slice !== 'onu' && slice !== 'jako' && ffWords.has(slice)) {
    return true;
  }
    }
  }

  return false;
}

function generateOutput(input, words, ffWords ,restricted) {
  // Split the input into words and spaces
  const inputWords = input.split(/(\s+)/);
  const exceptions = require('../public/restricted.json');// Replace with your actual exceptions

  // Generate the output HTML
  const outputHtml = inputWords.map(word => {
    // If it's a space, return it as is
    if (word.trim() === '') {
      return word;
    }
    // Check if the word is in the ff words set
    else if (isWordInFfSet(word.toLowerCase(), ffWords)) {
      // If the word is in the ff words set, return it wrapped in a span with inline CSS for purple color
      return <span style={{color: 'purple'}}>{word}</span>;
    }

     // Check if the word is in the restricted set words set
     else if (isWordInFfSet(word.toLowerCase(), restricted)) {
      // If the word is in the ff words set, return it wrapped in a span with inline CSS for purple color
      return <span style={{color: 'brown'}}>{word}</span>;
    }
    // Check if the word is in the set
    else if (word.toLowerCase() !== 'pa' && isWordInSet(word.toLowerCase(), words) && !exceptions.includes(word.toLowerCase())) {
      // If the word is in the set and not in the exceptions, return it wrapped in a span with inline CSS for green color
      return <span id="txt" style={{color: 'green'}}>{word}</span>;
    } else {
      // If the word is not in the set or it's in the exceptions, return it wrapped in a span with inline CSS for red color
      return <span style={{color: 'red'}}>{word}</span>;
    }

  });

  return outputHtml;
}

// Import the restricted list
const restrictedList = require('../public/restricted.json');

function calculateIntelligibility(input, words, ffWords) {
  // Split the input into words and spaces
  const inputWords = input.split(/(\s+)/);

  // Initialize the count of intelligible words and total words
  let intelligibleWordsCount = 0;
  let totalWordsCount = 0;

  inputWords.forEach(word => {
    // If it's a space, ignore it
    if (word.trim() !== '') {
      // Increment the total words count
      totalWordsCount++;

      // Check if the word is in the ff words set or in the restricted list
      if (isWordInFfSet(word.toLowerCase(), ffWords) || restrictedList.includes(word.toLowerCase())) {
        // If the word is in the ff words set or in the restricted list, do not count it as a match
        return;
      }

      // Check if the word is in the set
      if (isWordInSet(word.toLowerCase(), words)) {
        // If the word is in the set, increment the intelligible words count
        intelligibleWordsCount++;
      }
    }
  });

  // Calculate the intelligibility percentage only if the input box is not empty
  const intelligibility = totalWordsCount > 0 ? (intelligibleWordsCount / totalWordsCount) * 100 : 0;

  return intelligibility.toFixed(2);
}