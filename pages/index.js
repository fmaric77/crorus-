import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function Home() {
  const [words, setWords] = useState(new Set());
  const [ffWords, setFfWords] = useState(new Set());
  const [input, setInput] = useState('');
  const [theme, setTheme] = useState('light'); // initially set to 'light'

  const output = useMemo(() => generateOutput(input, words, ffWords), [input, words, ffWords]);
  const intelligibility = useMemo(() => calculateIntelligibility(input, words, ffWords), [input, words, ffWords]);

  // Fetch the words from the server
  useEffect(() => {  
      const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light';
      setTheme(storedTheme || 'light');
    document.body.className = '';
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

  return (
    <div>
<button onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀'}</button>

          <button onClick={saveToPdf}>Save to PDF</button>

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
  const latinWord = transliterateCyrillicToLatin(word);

  if (words.has(word) || words.has(latinWord)) {
    return true;
  }

  // Check if removing a 'j' from the word or its transliteration results in a word that's in the set
  for (let i = 0; i < word.length; i++) {
    if (word[i] === 'j' || latinWord[i] === 'j') {
      const wordWithoutJ = word.slice(0, i) + word.slice(i + 1);
      const latinWordWithoutJ = latinWord.slice(0, i) + latinWord.slice(i + 1);
      if (words.has(wordWithoutJ) || words.has(latinWordWithoutJ)) {
        return true;
      }
    }
  }

  // Check if adding a 'j' before 'e' in the word or its transliteration results in a word that's in the set
  for (let i = 1; i < word.length - 1; i++) {
    if (word[i] === 'e' || latinWord[i] === 'e') {
      const wordWithJe = word.slice(0, i) + 'j' + word.slice(i);
      const latinWordWithJe = latinWord.slice(0, i) + 'j' + latinWord.slice(i);
      if (words.has(wordWithJe) || words.has(latinWordWithJe)) {
        return true;
      }
    }
  }

  // Check if removing the last character from the word or its transliteration results in a word that's in the set
  const wordWithoutLastChar = word.slice(0, -1);
  const latinWordWithoutLastChar = latinWord.slice(0, -1);
  if (words.has(wordWithoutLastChar) || words.has(latinWordWithoutLastChar)) {
    return true;
  }

  // Check if replacing the last character with 'a', 'e', 'i', 'o', or 'u' results in a word that's in the set
  const vowels = ['a', 'e', 'i', 'o', 'u', 'j'];
  for (let i = 0; i < vowels.length; i++) {
    const wordWithVowel = word.slice(0, -1) + vowels[i];
    const latinWordWithVowel = latinWord.slice(0, -1) + vowels[i];
    if (words.has(wordWithVowel) || words.has(latinWordWithVowel)) {
      return true;
    }
  }

  const vowelsadd = ['a', 'e', 'i', 'o', 'u', 'j'];
for (let i = 0; i < vowelsadd.length; i++) {
  const wordWithVowel = word + vowelsadd[i];
  const latinWordWithVowel = latinWord + vowelsadd[i];
  if (words.has(wordWithVowel) || words.has(latinWordWithVowel)) {
    return true;
  }
}


  // Check if removing 'j' from the end of the word or its transliteration results in a word that's in the set
  if (word[word.length - 1] === 'j' || latinWord[latinWord.length - 1] === 'j') {
    const wordWithoutLastJ = word.slice(0, -1);
    const latinWordWithoutLastJ = latinWord.slice(0, -1);
    if (isWordInSet(wordWithoutLastJ, words) || isWordInSet(latinWordWithoutLastJ, words)) {
      return true;
    }
  }

  if (word.endsWith('ja') || latinWord.endsWith('ja')) {
    const wordWithoutLastJa = word.slice(0, -2);
    const latinWordWithoutLastJa = latinWord.slice(0, -2);
    if (words.has(wordWithoutLastJa) || words.has(latinWordWithoutLastJa)) {
      return true;
    }
  }

  // Check if the word without punctuation or its transliteration is in the set
  const punctuation = [':', ',', '!', ';', '?'];
  if (punctuation.includes(word[word.length - 1]) || punctuation.includes(latinWord[latinWord.length - 1])) {
    const wordWithoutPunctuation = word.slice(0, -1);
    const latinWordWithoutPunctuation = latinWord.slice(0, -1);
    if (words.has(wordWithoutPunctuation) || words.has(latinWordWithoutPunctuation)) {
      return true;
    }
  }

  return false;
}

function isWordInFfSet(word, ffWords) {
  // Check if the word or a part of it is in the ff words set
  for (let i = 0; i < word.length; i++) {
    for (let j = i + 1; j <= word.length; j++) {
      const slice = word.slice(i, j);
      if ((slice === 'mir' && word === 'mir') || (slice === 'pora' && word === 'pora') || (slice === 'para' && word === 'para')) {
        return true;
      }
      if (slice !== 'mir' && slice !== 'pora' && slice !== 'para' && ffWords.has(slice)) {
        return true;
      }
    }
  }

  return false;
}

function generateOutput(input, words, ffWords) {
  // Split the input into words and spaces
  const inputWords = input.split(/(\s+)/);

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
    // Check if the word is in the set
    else if (isWordInSet(word.toLowerCase(), words)) {
      // If the word is in the set, return it wrapped in a span with inline CSS for green color
      return <span id="txt" style={{color: 'green'}}>{word}</span>;
        }    // If the word is not in the set, return it wrapped in a span with inline CSS for red color
    else {
      return <span style={{color: 'red'}}>{word}</span>;
    }
  });

  return outputHtml;
}

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

      // Check if the word is in the ff words set
      if (isWordInFfSet(word.toLowerCase(), ffWords)) {
        // If the word is in the ff words set, do not count it as a match
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