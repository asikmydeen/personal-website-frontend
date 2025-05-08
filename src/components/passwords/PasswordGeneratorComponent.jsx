import React, { useState } from "react";

const PasswordGeneratorComponent = ({ onPasswordGenerated, onClose, onUsePassword }) => {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const generatePassword = () => {
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const numberChars = "0123456789";
    const symbolChars = "!@#$%^&*()_+-=[]{};:'\",.<>/?|\\";

    let charPool = "";
    if (includeUppercase) charPool += uppercaseChars;
    if (includeLowercase) charPool += lowercaseChars;
    if (includeNumbers) charPool += numberChars;
    if (includeSymbols) charPool += symbolChars;

    if (charPool === "") {
      setGeneratedPassword("Please select at least one character type.");
      return;
    }

    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charPool.length);
      password += charPool[randomIndex];
    }
    setGeneratedPassword(password);
  };

  const handleUsePassword = () => {
    if (generatedPassword && !generatedPassword.startsWith("Please select")) {
      onPasswordGenerated(generatedPassword);
      if (typeof onUsePassword === 'function') {
        onUsePassword(generatedPassword);
      }
      // Log for debugging
      console.log("Password used:", generatedPassword);
    }
  };

  const sliderThumbStyle = {
    WebkitAppearance: "none",
    appearance: "none",
    width: "20px",
    height: "20px",
    background: "#4f46e5", // indigo-600
    cursor: "pointer",
    borderRadius: "50%",
  };

  return (
    <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <label htmlFor="length" className="block text-sm font-medium text-gray-700">Password Length: {length}</label>
            <input
              type="range"
              id="length"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center">
              <input type="checkbox" id="uppercase" checked={includeUppercase} onChange={(e) => setIncludeUppercase(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <label htmlFor="uppercase" className="ml-2 block text-sm text-gray-900">Uppercase (A-Z)</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="lowercase" checked={includeLowercase} onChange={(e) => setIncludeLowercase(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <label htmlFor="lowercase" className="ml-2 block text-sm text-gray-900">Lowercase (a-z)</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="numbers" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <label htmlFor="numbers" className="ml-2 block text-sm text-gray-900">Numbers (0-9)</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="symbols" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <label htmlFor="symbols" className="ml-2 block text-sm text-gray-900">Symbols (!@#$...)</label>
            </div>
          </div>
        </div>

        <button
          onClick={generatePassword}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Generate Password
        </button>

        {generatedPassword && (
          <div className="mt-3 p-3 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-800 break-all font-mono">{generatedPassword}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleUsePassword}
            disabled={!generatedPassword || generatedPassword.startsWith("Please select")}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Use This Password
          </button>
        </div>
    </div>
  );
};

export default PasswordGeneratorComponent;
