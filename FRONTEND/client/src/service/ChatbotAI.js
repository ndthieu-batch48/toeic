export async function sendPromptToBackend(prompt, languageId = 1) {
  try {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/gemini/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, language_id: languageId }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    return data.response; // Trả về câu trả lời từ Gemini
  } catch (error) {
    console.error('Error sending prompt to backend:', error);
    throw error;
  }
}

export async function sendPromptWithImageToBackend(prompt, media_id, languageId = 1) {
  try {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/gemini/chat-with-image`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, id: media_id, language_id: languageId }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    return data.response;
  } catch (error) {
    console.error('Error sending prompt with image to backend:', error);
    throw error;
  }
}
