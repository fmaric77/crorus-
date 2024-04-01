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
  module.exports = isWordInSet;