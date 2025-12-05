'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Tesseract from 'tesseract.js';
import menuData from '@/menu.json';

export default function ScanOrderPage() {
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [matchedItems, setMatchedItems] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  const router = useRouter();

  // Initialize OCR worker on mount
  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
              console.log('OCR Engine:', m.status);
            }
          }
        });
        workerRef.current = worker;
        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize OCR worker:', err);
        setIsInitializing(false);
      }
    };

    initWorker();

    // Cleanup worker on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Extract all menu items into a flat array for matching
  const getAllMenuItems = () => {
    const items = [];

    Object.keys(menuData).forEach(category => {
      const categoryData = menuData[category];

      if (categoryData.items) {
        categoryData.items.forEach(item => {
          items.push({
            name: item.name,
            slug: item.slug,
            price: item.price,
            category
          });
        });
      }

      // Handle nested structures like lunch
      if (category === 'lunch') {
        Object.keys(categoryData).forEach(subcategory => {
          if (subcategory !== 'title') {
            const subData = categoryData[subcategory];
            if (subData.items) {
              subData.items.forEach(item => {
                items.push({
                  name: item.name,
                  slug: item.slug,
                  price: item.price,
                  category: `${category}-${subcategory}`
                });
              });
            } else if (subData.name) {
              items.push({
                name: subData.name,
                slug: subData.slug,
                price: subData.price,
                category: `${category}-${subcategory}`
              });
            }
          }
        });
      }
    });

    return items;
  };

  // Resize image to improve OCR speed
  const resizeImage = (dataUrl, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if image is larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Resize image for faster processing
        const resizedImage = await resizeImage(reader.result);
        setImage(resizedImage);
        setError(null);
        setExtractedText('');
        setMatchedItems([]);
        setShowConfirmation(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image || !workerRef.current) {
      setError('OCR engine not ready. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setOcrProgress(0);
    setError(null);

    try {
      const result = await workerRef.current.recognize(image, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const text = result.data.text;
      setExtractedText(text);

      // Parse text and match items
      const matched = matchTextToMenuItems(text);
      setMatchedItems(matched);

      if (matched.length > 0) {
        setShowConfirmation(true);
      } else {
        setError('No menu items found in the scanned text. Please try again or enter manually.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const matchTextToMenuItems = (text) => {
    const lines = text.toLowerCase().split('\n');
    const allMenuItems = getAllMenuItems();
    const matched = [];

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Try to match menu items
      allMenuItems.forEach(menuItem => {
        const itemName = menuItem.name.toLowerCase();

        // Check if line contains the item name
        if (cleanLine.includes(itemName)) {
          // Try to extract quantity (look for numbers before the item name)
          const quantityMatch = line.match(/(\d+)\s*x/i);
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

          matched.push({
            name: menuItem.name,
            slug: menuItem.slug,
            price: menuItem.price || 0,
            quantity,
            options: {},
            notes: ''
          });
        }
      });
    });

    return matched;
  };

  const handleConfirmOrder = async () => {
    if (!tableNumber) {
      setError('Please enter a table number');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber),
          items: matchedItems
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      // Redirect to success or home
      router.push('/?orderSuccess=true');
    } catch (err) {
      console.error('Order Error:', err);
      setError('Failed to submit order. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Scan Paper Order</h1>
          <Link
            href="/"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            ← Back
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-blue-900 mb-2">How to use:</h2>
          <ol className="list-decimal list-inside text-blue-800 text-sm space-y-1">
            <li>Take a clear photo of the paper order</li>
            <li>Upload the image using the button below</li>
            <li>Click "Process Image" to scan the text</li>
            <li>Review and confirm the detected items</li>
            <li>Enter table number and submit</li>
          </ol>
        </div>

        {/* Initialization Status */}
        {isInitializing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">⏳ Initializing OCR engine... This may take a moment.</p>
          </div>
        )}

        {/* Image Upload */}
        {!showConfirmation && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isInitializing}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isInitializing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isInitializing ? '⏳ Initializing OCR...' : '📷 Upload/Take Photo'}
            </button>

            {image && (
              <div className="space-y-4">
                <img
                  src={image}
                  alt="Uploaded order"
                  className="w-full rounded-lg border-2 border-gray-200"
                />

                <button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {isProcessing ? `Processing... ${ocrProgress}%` : '🔍 Process Image'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* OCR Results */}
        {extractedText && !showConfirmation && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Extracted Text:</h3>
            <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
              {extractedText}
            </pre>
          </div>
        )}

        {/* Confirmation Screen */}
        {showConfirmation && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Order</h2>

            {/* Matched Items */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Detected Items:</h3>
              <div className="space-y-2">
                {matchedItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.quantity > 1 && <span className="text-gray-600 ml-2">x{item.quantity}</span>}
                    </div>
                    <span className="text-gray-700">£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>£{matchedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Table Number Input */}
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Table Number:
              </label>
              <input
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Enter table number"
                min="1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setImage(null);
                  setMatchedItems([]);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={!tableNumber}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                Confirm & Send to Kitchen
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
