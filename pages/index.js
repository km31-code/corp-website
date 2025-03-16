import { useState, useEffect } from 'react';
import Head from 'next/head';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [helpVisible, setHelpVisible] = useState(false); // State for help popout visibility
  const [selectedStores, setSelectedStores] = useState({
    snaxa: true,
    vittles: true,
    mug: true,
    midnight: true,
    ug: true,
    hilltoss: true,
  });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1.0);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const handleSearch = async (searchQuery) => {
    if (!searchQuery) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/search?query=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setError(null);
      } else {
        setError('Item not found');
        setResults([]);
      }
    } catch (err) {
      setError('Error searching for item');
      setResults([]);
    }
  };

  const debouncedSearch = debounce(handleSearch, 300);

  useEffect(() => {
    if (query.length >= 3) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const toggleStore = (store) => {
    setSelectedStores((prev) => ({
      ...prev,
      [store]: !prev[store],
    }));
  };

  const handleOutsideClick = (event) => {
    if (!event.target.closest(".help-popup") && !event.target.closest(".help-button")) {
      setHelpVisible(false);
    }
  };

  useEffect(() => {
    if (helpVisible) {
      document.addEventListener("click", handleOutsideClick);
    } else {
      document.removeEventListener("click", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [helpVisible]);

  const filteredResults = Object.values(
    results.reduce((acc, item) => {
      const storeName = item.orders.storefront?.toLowerCase() || "unknown";
      const itemKey = `${item.name.toLowerCase()}_${storeName}`; // Combine item name and store as a unique key

      if (
        selectedStores[storeName] &&
        item.price > 0 &&
        (!acc[itemKey] || acc[itemKey].createdtime < item.createdtime)
      ) {
        acc[itemKey] = item; // Keep the most recent item for each unique name within each store
      }
      return acc;
    }, {})
  );

  return (
    <div className="min-h-screen bg-[#f5ecd8] text-gray-800">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Logo Section */}
      <div className="flex items-center p-4">
        <a href="https://www.thecorp.org" target="_blank" rel="noopener noreferrer">
          <img src="/images/corp_logo.png" alt="Logo" className="h-20 w-auto mr-4" />
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="relative mb-12">
          <h1 className="text-4xl font-medium text-center">Search for Snacks!</h1>
          <p className="text-center text-sm text-gray-600 mt-2">Made by Corp IT</p>

          {/* Help Icon */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => setHelpVisible(!helpVisible)}
              className="help-button text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label="Help"
            >
              <span className="text-2xl font-bold">?</span>
            </button>
            {helpVisible && (
              <div className="help-popup absolute right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg p-4 w-72">
                <h2 className="text-lg font-medium mb-2">How to Use This Page</h2>
                <p className="text-sm text-gray-700">
                  Type in the search box for the item you want to find! You will see a
                  list of all the items matching your request. Within each box, you
                  can find the item name, the price, the time the item was last purchased
                  (a more recent time means it is more likely that the item is still available), 
                  and the Corp location. You can also filter by store by (un)checking the boxes below the search bar.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#e3f2fd] rounded-lg shadow-sm p-4 mb-8 mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search..."
            className="w-full px-4 py-3 text-lg rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-200"
          />

          <div className="grid grid-cols-3 gap-4 mt-6">
            {Object.keys(selectedStores).map((store) => (
              <label key={store} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedStores[store]}
                  onChange={() => toggleStore(store)}
                  className="h-4 w-4 text-gray-600 rounded"
                />
                <span className="text-sm text-gray-600 capitalize">
                  {store}
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {filteredResults.length > 0 && (
          <div className="space-y-4">
            {filteredResults.map((item) => (
              <div 
                key={item.id} 
                className="bg-[#e3f2fd] border-l-4 border-blue-500 rounded-lg shadow-sm p-6 transition duration-200 hover:shadow-md"
              >
                <h3 className="text-xl font-medium mb-2">{item.name}</h3>
                <p className="text-lg text-gray-900 mb-2">
                  ${(item.price / 100).toFixed(2)}
                </p>
                <div className="text-sm text-gray-500">
                  <p>Last Purchased: {formatDate(item.createdtime)}</p>
                  <p>Store: {item.orders.storefront || "Unknown"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          font-family: 'Work Sans', sans-serif;
          background-color: #f5ecd8;
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
