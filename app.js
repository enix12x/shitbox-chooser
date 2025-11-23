let buttons = [];
let branding = 'Shitbox Chooser';
let currentButton = null;
let passwordModal = null;
let disclaimerModal = null;

// Initialize modals
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  
  try {
    passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
    disclaimerModal = new bootstrap.Modal(document.getElementById('disclaimerModal'));
    
    setupPasswordSubmit();
    setupDisclaimerOk();
    loadConfig();
  } catch (error) {
    console.error('Error during initialization:', error);
    document.getElementById('buttonsContainer').innerHTML = 
      '<p class="text-danger">Error initializing: ' + error.message + '</p>';
  }
});

// Load config from backend
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    const data = await response.json();
    console.log('Loaded config:', data);
    branding = data.branding;
    buttons = data.buttons || [];
    
    // Update branding
    document.getElementById('branding').textContent = branding;
    document.title = branding;
    
    // Render buttons
    renderButtons();
  } catch (error) {
    console.error('Error loading config:', error);
    document.getElementById('buttonsContainer').innerHTML = 
      '<p class="text-danger">Error loading configuration: ' + error.message + '</p>';
  }
}

// Render buttons
function renderButtons() {
  const container = document.getElementById('buttonsContainer');
  if (!container) {
    console.error('buttonsContainer not found!');
    return;
  }
  
  container.innerHTML = '';
  console.log('Rendering buttons, count:', buttons.length);
  console.log('Buttons array:', buttons);
  
  if (!Array.isArray(buttons) || buttons.length === 0) {
    container.innerHTML = '<p class="text-muted">No buttons configured</p>';
    return;
  }
  
  buttons.forEach((button, index) => {
    console.log(`Rendering button ${index}:`, button);
    try {
      let btn;
      if (button.useBootstrap !== false) {
        // Bootstrap styled button (default)
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-primary w-100 mb-2';
        btn.textContent = button.name || 'Unnamed Button';
        btn.onclick = () => handleButtonClick(button);
      } else {
        // Plain list styled button
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'plain-button text-light';
        btn.textContent = button.name || 'Unnamed Button';
        btn.onclick = () => handleButtonClick(button);
      }
      container.appendChild(btn);
      console.log(`Button ${index} appended to container`);
    } catch (error) {
      console.error(`Error rendering button ${index}:`, error);
    }
  });
  
  console.log('Container after rendering:', container.innerHTML);
}

// Handle button click
async function handleButtonClick(button) {
  currentButton = button;
  
  // Check if password is required
  if (button.passwordProtected) {
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').style.display = 'none';
    passwordModal.show();
    return;
  }
  
  // Check if disclaimer is required
  if (button.showDisclaimer) {
    document.getElementById('disclaimerText').textContent = button.disclaimer;
    disclaimerModal.show();
    return;
  }
  
  // Direct redirect
  redirectToUrl(button.url);
}

// Setup password submit
function setupPasswordSubmit() {
  document.getElementById('passwordSubmit').addEventListener('click', async () => {
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('passwordError');
    
    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buttonId: currentButton.id,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        passwordModal.hide();
        
        // Check if disclaimer is required after password
        if (currentButton.showDisclaimer) {
          document.getElementById('disclaimerText').textContent = currentButton.disclaimer;
          disclaimerModal.show();
        } else {
          redirectToUrl(currentButton.url);
        }
      } else {
        errorDiv.textContent = data.error || 'Invalid password';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = 'Error verifying password';
      errorDiv.style.display = 'block';
    }
  });
  
  // Allow Enter key to submit password
  document.getElementById('passwordInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('passwordSubmit').click();
    }
  });
}

// Setup disclaimer OK
function setupDisclaimerOk() {
  document.getElementById('disclaimerOk').addEventListener('click', () => {
    disclaimerModal.hide();
    redirectToUrl(currentButton.url);
  });
}

// Redirect to URL
function redirectToUrl(url) {
  window.location.href = url;
}

