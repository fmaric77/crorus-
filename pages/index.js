import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";


export default function Home() {
  const [words, setWords] = useState(new Set());
  const [ffWords, setFfWords] = useState(new Set());
  const [input, setInput] = useState('');

  const output = useMemo(() => generateOutput(input, words, ffWords), [input, words, ffWords]);
  const intelligibility = useMemo(() => calculateIntelligibility(input, words, ffWords), [input, words, ffWords]);

  // Fetch the words from the server
  useEffect(() => {
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
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
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

function isWordInSet(word, words) {
  // Check if removing a 'j' from the word results in a word that's in the set
  for (let i = 0; i < word.length; i++) {
    if (word[i] === 'j') {
      const wordWithoutJ = word.slice(0, i) + word.slice(i + 1);
      if (words.has(wordWithoutJ)) {
        return true;
      }
    }
  }

  // Check if adding a 'j' before 'e' in the word results in a word that's in the set
  for (let i = 1; i < word.length - 1; i++) {
    if (word[i] === 'e') {
      const wordWithJe = word.slice(0, i) + 'j' + word.slice(i);
      if (words.has(wordWithJe)) {
        return true;
      }
    }
  }

  // If no version of the word without 'j' or with 'je' is in the set, check if the word itself is in the set
  if (words.has(word)) {
    return true;
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
      return <span style={{color: 'green'}}>{word}</span>;
    }
    // If the word is not in the set, return it wrapped in a span with inline CSS for red color
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