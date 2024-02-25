// pages/index.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [words, setWords] = useState(new Set());
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([]);
  const [intelligibility, setIntelligibility] = useState('');

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

    // Split the input into words and spaces
    const inputWords = e.target.value.split(/(\s+)/);

    // Initialize the count of intelligible words and total words
    let intelligibleWordsCount = 0;
    let totalWordsCount = 0;

    // Generate the output HTML
    const outputHtml = inputWords.map(word => {
      // If it's a space, return it as is
      if (word.trim() === '') {
        return word;
      }
      // Check if the word is in the set
      else {
        // Increment the total words count
        totalWordsCount++;

        // Remove punctuation from the end of the word
        const wordWithoutPunctuation = word.replace(/[.,:\/!?]$/, '');

        // Remove "i" from the end of the word if it's there and the word is more than one character
        const wordWithoutI = wordWithoutPunctuation.endsWith('i') && wordWithoutPunctuation.length > 1 ? wordWithoutPunctuation.slice(0, -1) : wordWithoutPunctuation;

        if (words.has(wordWithoutI) || wordWithoutI === 'i') {
          // If the word is in the set or the word is "i", return it wrapped in a span with inline CSS for green color
          intelligibleWordsCount++;
          return <span style={{color: 'green'}}>{word}</span>;
        } else {
          // If the word is not in the set, return it wrapped in a span with inline CSS for red color
          return <span style={{color: 'red'}}>{word}</span>;
        }
      }
    });

    setOutput(outputHtml);

    // Calculate the intelligibility percentage only if the input box is not empty
    if (e.target.value.trim() !== '') {
      const intelligibilityPercentage = (intelligibleWordsCount / totalWordsCount) * 100;
      setIntelligibility(`Intelligibility: ${intelligibilityPercentage.toFixed(2)}%`);
    } else {
      setIntelligibility('');
    }
  };

  // Handle fullscreen button click
  const handleFullscreenClick = () => {
    // Your existing logic here
  };

  return (
    <div>
      <button id="fullscreen-btn" onClick={handleFullscreenClick}>Fullscreen</button>
      <div id="description">
        {/* Your existing HTML here */}
      </div>
      <div id="instructions">
        {/* Your existing HTML here */}
      </div>
      <textarea id="word-checker-input" rows="4" cols="50" value={input} onChange={handleInputChange}></textarea>
      <div id="word-checker-output">{output}</div>
      <div id="intelligibility">{intelligibility}</div>
    </div>
  );
}