import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Home() {
  const [words, setWords] = useState(new Set());
  const [input, setInput] = useState('');

  const output = useMemo(() => generateOutput(input, words), [input, words]);
  const intelligibility = useMemo(() => calculateIntelligibility(input, words), [input, words]);

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
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

// Handle save as PDF button click
const handleSaveAsPdfClick = () => {
    html2canvas(document.querySelector("#word-checker-output")).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // A4 size page of PDF
  
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
  
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
  
      // Calculate the width and height of the image in the PDF
      const imgWidth = pdfWidth;
      const imgHeight = (canvasHeight * imgWidth) / canvasWidth;
  
      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
      // Add intelligibility to the PDF
      pdf.text(intelligibility, 10, pdfHeight - 10);
  
      pdf.save("output.pdf");
    });
  };

  return (
    <div>
      <button id="save-as-pdf-btn" onClick={handleSaveAsPdfClick}>Save as PDF</button>
      <textarea id="word-checker-input" rows="4" cols="50" value={input} onChange={handleInputChange}></textarea>
      <div id="word-checker-output">{output}</div>
      <div id="intelligibility">{intelligibility}</div>
    </div>
  );
}

function generateOutput(input, words) {
  // Split the input into words and spaces
  const inputWords = input.split(/(\s+)/);

  // Generate the output HTML
  const outputHtml = inputWords.map(word => {
    // If it's a space, return it as is
    if (word.trim() === '') {
      return word;
    }
    // Check if the word is in the set
    else {
      // Remove punctuation from the end of the word
      const wordWithoutPunctuation = word.replace(/[.,:\/!?]$/, '');

      // Remove "i" from the end of the word if it's there and the word is more than one character
      const wordWithoutI = wordWithoutPunctuation.endsWith('i') && wordWithoutPunctuation.length > 1 ? wordWithoutPunctuation.slice(0, -1) : wordWithoutPunctuation;

      if (words.has(wordWithoutI) || wordWithoutI === 'i') {
        // If the word is in the set or the word is "i", return it wrapped in a span with inline CSS for green color
        return <span style={{color: 'green'}}>{word}</span>;
      } else {
        // If the word is not in the set, return it wrapped in a span with inline CSS for red color
        return <span style={{color: 'red'}}>{word}</span>;
      }
    }
  });

  return outputHtml;
}

function calculateIntelligibility(input, words) {
  // Split the input into words and spaces
  const inputWords = input.split(/(\s+)/);

  // Initialize the count of intelligible words and total words
  let intelligibleWordsCount = 0;
  let totalWordsCount = 0;

  inputWords.forEach(word => {
    // If it's a space, return it as is
    if (word.trim() !== '') {
      // Increment the total words count
      totalWordsCount++;

      // Remove punctuation from the end of the word
      const wordWithoutPunctuation = word.replace(/[.,:\/!?]$/, '');

      // Remove "i" from the end of the word if it's there and the word is more than one character
      const wordWithoutI = wordWithoutPunctuation.endsWith('i') && wordWithoutPunctuation.length > 1 ? wordWithoutPunctuation.slice(0, -1) : wordWithoutPunctuation;

      if (words.has(wordWithoutI) || wordWithoutI === 'i') {
        // If the word is in the set or the word is "i", increment the intelligible words count
        intelligibleWordsCount++;
      }
    }
  });

  // Calculate the intelligibility percentage only if the input box is not empty
  if (input.trim() !== '') {
    const intelligibilityPercentage = (intelligibleWordsCount / totalWordsCount) * 100;
    return `Intelligibility: ${intelligibilityPercentage.toFixed(2)}%`;
  } else {
    return '';
  }
}