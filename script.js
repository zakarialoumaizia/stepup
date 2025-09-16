// Step Up Club Registration System
class RegistrationSystem {
  constructor() {
    this.telegramBotToken = "8459511865:AAHdDSLdjwYx734WJM-rie0Bum0abXKoco8";
    this.telegramChatId = "-1002555274449";
    this.registeredUsers = new Set();
    this.telegramUsers = new Set();
    this.currentStep = 1;
    this.totalSteps = 4;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadExistingData();
    this.updateProgressBar();
    this.populateFacultyOptions();
  }

  setupEventListeners() {
    // Form submission
    const form = document.getElementById('registrationForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // File upload handlers
    this.setupFileUpload('studentCard', 'studentCardPreview');
    this.setupFileUpload('photo', 'photoPreview');

    // Registration number validation
    const regNumberInput = document.getElementById('registrationNumber');
    if (regNumberInput) {
      regNumberInput.addEventListener('blur', () => this.validateRegistrationNumber());
    }

    // Phone number validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('blur', () => this.validatePhoneNumber());
    }


    // Faculty selection
    const facultySelect = document.getElementById('faculty');
    if (facultySelect) {
      facultySelect.addEventListener('change', () => this.updateDepartmentOptions());
    }

    // Step navigation
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
  }

  setupFileUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;

    input.addEventListener('change', (e) => this.handleFileUpload(e, previewId));
    
    // Drag and drop functionality
    const label = input.parentElement.querySelector('.file-upload-label');
    if (label) {
      label.addEventListener('dragover', (e) => this.handleDragOver(e));
      label.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      label.addEventListener('drop', (e) => this.handleDrop(e, input));
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  }

  handleDrop(e, input) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      input.files = files;
      input.dispatchEvent(new Event('change'));
    }
  }

  async handleFileUpload(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById(previewId);
    if (!preview) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.showToast('Please upload only JPG, PNG, or PDF files', 'error');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showToast('File size must be less than 5MB', 'error');
      return;
    }

    // Show file preview
    this.showFilePreview(file, preview);

    // If it's an image, check readability
    if (file.type.startsWith('image/')) {
      await this.checkImageReadability(file);
    }
  }

  showFilePreview(file, preview) {
    preview.innerHTML = `
      <div class="file-preview-item">
        <i class="fas fa-file-alt file-preview-icon"></i>
        <div class="file-preview-info">
          <div class="file-preview-name">${file.name}</div>
          <div class="file-preview-size">${this.formatFileSize(file.size)}</div>
        </div>
        <button type="button" class="file-preview-remove" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }

  async checkImageReadability(file) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple readability check - count non-white pixels
        let nonWhitePixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          if (brightness < 240) nonWhitePixels++;
        }
        
        const readabilityScore = (nonWhitePixels / (canvas.width * canvas.height)) * 100;
        
        if (readabilityScore < 5) {
          this.showToast('Image appears to be too light or empty. Please ensure the document is clearly visible.', 'warning');
        } else if (readabilityScore > 95) {
          this.showToast('Image appears to be too dark. Please ensure the document is clearly visible.', 'warning');
        } else {
          this.showToast('Image quality looks good!', 'success');
        }
      };
      
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error checking image readability:', error);
    }
  }

  async convertImageToPDF(file) {
    try {
      // This is a simplified PDF conversion
      // In a real application, you would use a library like jsPDF or PDF-lib
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to blob (simplified - in reality you'd use jsPDF)
          canvas.toBlob((blob) => {
            const pdfFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.pdf'), {
              type: 'application/pdf'
            });
            resolve(pdfFile);
          }, 'application/pdf');
        };
        
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error converting image to PDF:', error);
      return file; // Return original file if conversion fails
    }
  }

  async validateRegistrationNumber() {
    const regNumber = document.getElementById('registrationNumber').value.trim();
    if (!regNumber) return;

    const validationMsg = document.getElementById('regNumberValidation');
    if (validationMsg) {
      // Check if registration number is exactly 8 digits
      if (!/^\d{8}$/.test(regNumber)) {
        validationMsg.textContent = 'Registration number must be exactly 8 digits.';
        validationMsg.className = 'validation-message error';
        return;
      }

      // Simulate API call to check if registration number exists
      // In a real application, this would be an actual API call
      const isRegistered = this.registeredUsers.has(regNumber);
      
      if (isRegistered) {
        validationMsg.textContent = 'This registration number is already registered.';
        validationMsg.className = 'validation-message error';
      } else {
        validationMsg.textContent = 'Registration number is valid and available.';
        validationMsg.className = 'validation-message success';
      }
    }
  }

  validatePhoneNumber() {
    const phone = document.getElementById('phone').value.trim();
    if (!phone) return;

    // Check if phone number starts with 06, 05, or 07
    if (!/^(06|05|07)\d+$/.test(phone)) {
      const phoneInput = document.getElementById('phone');
      if (phoneInput) {
        phoneInput.classList.add('error');
      }
      this.showToast('Phone number must start with 06, 05, or 07', 'error');
    } else {
      const phoneInput = document.getElementById('phone');
      if (phoneInput) {
        phoneInput.classList.remove('error');
      }
    }
  }

  populateFacultyOptions() {
    const facultySelect = document.getElementById('faculty');
    if (!facultySelect) return;

    const faculties = [
      'Faculty of Science and Technology',
      'Faculty of Natural and Life Sciences',
      'Faculty of Economics, Commerce and Management Sciences',
      'Faculty of Law and Political Sciences',
      'Faculty of Arts and Languages',
      'Faculty of Social and Human Sciences',
      'Institute of Physical and Sports Activities Sciences and Techniques',
      'Annex of Medicine',
      'Annex of the Higher School of Teachers'
    ];

    facultySelect.innerHTML = '<option value="">Select Faculty</option>';
    faculties.forEach(faculty => {
      const option = document.createElement('option');
      option.value = faculty;
      option.textContent = faculty;
      facultySelect.appendChild(option);
    });
  }

  updateDepartmentOptions() {
    const facultySelect = document.getElementById('faculty');
    const departmentSelect = document.getElementById('department');
    
    if (!facultySelect || !departmentSelect) return;

    const selectedFaculty = facultySelect.value;
    departmentSelect.innerHTML = '<option value="">Select Department</option>';

    if (!selectedFaculty) return;

    const departments = this.getDepartmentsByFaculty(selectedFaculty);
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      departmentSelect.appendChild(option);
    });
  }

  getDepartmentsByFaculty(faculty) {
    const departmentMap = {
      'Faculty of Science and Technology': [
        'Department of Computer Science',
        'Department of Mathematics',
        'Department of Basic Sciences and Technology Education',
        'Department of Civil Engineering',
        'Department of Electrical Engineering',
        'Department of Process Engineering',
        'Department of Mechanical Engineering',
        'Department of Material Sciences'
      ],
      'Faculty of Natural and Life Sciences': [
        'Department of Biological Sciences',
        'Department of Common Education in Natural and Life Sciences',
        'Department of Food Science',
        'Department of Ecology and Environment'
      ],
      'Faculty of Economics, Commerce and Management Sciences': [
        'Department of Basic Education – Management',
        'Department of Economic Sciences',
        'Department of Management Sciences',
        'Department of Commercial Sciences',
        'Department of Finance and Accounting Sciences'
      ],
      'Faculty of Law and Political Sciences': [
        'Department of Public Law',
        'Department of Common Education – Law',
        'Department of Private Law'
      ],
      'Faculty of Arts and Languages': [
        'Department of French Language',
        'Department of Arabic Language and Literature',
        'Department of English Language'
      ],
      'Faculty of Social and Human Sciences': [
        'Department of Information and Communication Sciences',
        'Department of Sociology',
        'Department of History',
        'Department of Psychology',
        'Department of Common Education – Social and Human Sciences'
      ],
      'Institute of Physical and Sports Activities Sciences and Techniques': [
        'Department of Sports Specialties',
        'Department of Basic Education – Physical and Sports Activities Sciences and Techniques'
      ],
      'Annex of Medicine': [
        'Department of Pharmacy'
      ],
      'Annex of the Higher School of Teachers': [
        'Department of Languages and Social Sciences',
        'Department of Sciences'
      ]
    };

    return departmentMap[faculty] || [];
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      this.currentStep++;
      this.updateStepVisibility();
      this.updateProgressBar();
      
      // Update review section if we're on the last step
      if (this.currentStep === this.totalSteps) {
        this.updateReviewSection();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepVisibility();
      this.updateProgressBar();
    }
  }

  validateCurrentStep() {
    const currentStepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
    if (!currentStepElement) return true;

    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('error');
        isValid = false;
      } else {
        field.classList.remove('error');
      }
    });

    if (!isValid) {
      this.showToast('Please fill in all required fields', 'error');
    }

    return isValid;
  }

  updateStepVisibility() {
    const steps = document.querySelectorAll('[data-step]');
    steps.forEach(step => {
      const stepNumber = parseInt(step.dataset.step);
      if (stepNumber === this.currentStep) {
        step.style.display = 'block';
        step.classList.add('fade-in');
      } else {
        step.style.display = 'none';
        step.classList.remove('fade-in');
      }
    });

    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) {
      prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
    }

    if (nextBtn) {
      nextBtn.style.display = this.currentStep < this.totalSteps ? 'inline-flex' : 'none';
    }

    if (submitBtn) {
      submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';
    }
  }

  updateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      const progress = (this.currentStep / this.totalSteps) * 100;
      progressFill.style.width = `${progress}%`;
    }
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    
    if (!this.validateCurrentStep()) {
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div> Processing...';
    }

    try {
      const formData = this.collectFormData();
      await this.submitToTelegram(formData);
      this.showToast('Registration submitted successfully!', 'success');
      this.resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      this.showToast('Error submitting registration. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Registration';
      }
    }
  }

  collectFormData() {
    const form = document.getElementById('registrationForm');
    const formData = new FormData(form);
    
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      registrationNumber: formData.get('registrationNumber'),
      baccalaureateYear: formData.get('baccalaureateYear'),
      faculty: formData.get('faculty'),
      department: formData.get('department'),
      telegramUsername: formData.get('telegramUsername'),
      skills: formData.get('skills'),
      studentCard: formData.get('studentCard'),
      photo: formData.get('photo')
    };

    return data;
  }

  async submitToTelegram(data) {
    const message = `
📌 *New Student Registration*

👤 **Personal Information:**
• Name: ${data.fullName}
• Email: ${data.email}
• Phone: ${data.phone}
• Registration Number: ${data.registrationNumber}

🎓 **Academic Information:**
• Baccalaureate Year: ${data.baccalaureateYear}
• Faculty: ${data.faculty}
• Department: ${data.department}

💡 **Skills:**
• Skills: ${data.skills}

📅 **Registration Date:** ${new Date().toLocaleDateString()}
    `;

    // Send text message
    await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.telegramChatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    // Send student card
    if (data.studentCard && data.studentCard.size > 0) {
      const formData = new FormData();
      formData.append('chat_id', this.telegramChatId);
      formData.append('document', data.studentCard, data.studentCard.name);

      await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendDocument`, {
        method: 'POST',
        body: formData
      });
    }

    // Send photo
    if (data.photo && data.photo.size > 0) {
      const formData = new FormData();
      formData.append('chat_id', this.telegramChatId);
      formData.append('photo', data.photo, data.photo.name);

      await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
    }

  }

  resetForm() {
    const form = document.getElementById('registrationForm');
    if (form) {
      form.reset();
    }

    // Clear file previews
    const previews = document.querySelectorAll('[id$="Preview"]');
    previews.forEach(preview => {
      preview.innerHTML = '';
    });

    // Reset step
    this.currentStep = 1;
    this.updateStepVisibility();
    this.updateProgressBar();

    // Clear validation messages
    const validationMessages = document.querySelectorAll('.validation-message');
    validationMessages.forEach(msg => {
      msg.textContent = '';
      msg.className = 'validation-message';
    });
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 5000);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updateReviewSection() {
    const formData = this.collectFormData();
    
    // Update personal information
    document.getElementById('reviewName').textContent = formData.fullName || '-';
    document.getElementById('reviewEmail').textContent = formData.email || '-';
    document.getElementById('reviewPhone').textContent = formData.phone || '-';
    document.getElementById('reviewRegNumber').textContent = formData.registrationNumber || '-';
    document.getElementById('reviewBacYear').textContent = formData.baccalaureateYear || '-';
    document.getElementById('reviewTelegram').textContent = formData.telegramUsername ? `@${formData.telegramUsername}` : '-';
    
    // Update academic information
    document.getElementById('reviewFaculty').textContent = formData.faculty || '-';
    document.getElementById('reviewDepartment').textContent = formData.department || '-';
    document.getElementById('reviewSkills').textContent = formData.skills || '-';
    
    
    // Update documents
    const studentCardFile = document.getElementById('studentCard').files[0];
    const photoFile = document.getElementById('photo').files[0];
    
    document.getElementById('reviewStudentCard').textContent = studentCardFile ? studentCardFile.name : '-';
    document.getElementById('reviewPhoto').textContent = photoFile ? photoFile.name : '-';
  }



  loadExistingData() {
    // Load existing registration numbers and Telegram users
    // In a real application, this would load from a database
    this.registeredUsers.add('REG001');
    this.registeredUsers.add('REG002');
    this.telegramUsers.add('john_doe');
    this.telegramUsers.add('jane_smith');
  }
}

// Initialize the registration system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RegistrationSystem();
  
  // Show privacy modal on page load
  showPrivacyModal();
});

// Utility functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone.replace(/\s/g, ''));
}

function validateRegistrationNumber(regNumber) {
  // Basic validation - adjust based on your institution's format
  const re = /^[A-Z0-9]{6,12}$/;
  return re.test(regNumber);
}

function validateTelegramUsername(username) {
  const re = /^[a-zA-Z0-9_]{5,32}$/;
  return re.test(username);
}



// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Privacy Modal Functions
function showPrivacyModal() {
  const modal = document.getElementById('privacyModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closePrivacyModal() {
  const modal = document.getElementById('privacyModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function acceptPrivacyAndContinue() {
  closePrivacyModal();
  // Enable form interaction
  const form = document.getElementById('registrationForm');
  if (form) {
    form.style.pointerEvents = 'auto';
    form.style.opacity = '1';
  }
}

// Receipt Generation Functions
function generateReceipt() {
  const formData = collectFormDataForReceipt();
  populateReceiptData(formData);
  
  // Show receipt in new window for printing
  const receiptWindow = window.open('', '_blank', 'width=800,height=600');
  const receiptContent = document.getElementById('receiptContainer').innerHTML;
  
  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Registration Receipt - Step Up Club</title>
      <style>
        ${getReceiptStyles()}
      </style>
    </head>
    <body>
      ${receiptContent}
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  
  receiptWindow.document.close();
}

function downloadReceiptPDF() {
  const formData = collectFormDataForReceipt();
  populateReceiptData(formData);
  
  // Generate PDF using jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Add header with better styling
  doc.setFontSize(24);
  doc.setTextColor(30, 58, 138);
  doc.text('Step Up Club', 105, 25, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(220, 38, 38);
  doc.text('University of Mohamed Cherif Messaadia Souk Ahras', 105, 35, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  doc.text('Sub-Directorate of Scientific, Cultural and Sports Activities', 105, 42, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(51, 51, 51);
  doc.text('Registration Receipt', 105, 55, { align: 'center' });
  
  // Add decorative line
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1);
  doc.line(20, 60, 190, 60);
  
  let yPosition = 75;
  
  // Personal Information Section
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text('Personal Information', 20, yPosition);
  yPosition += 12;
  
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  
  const personalInfo = [
    ['Full Name:', formData.fullName || '-'],
    ['Email:', formData.email || '-'],
    ['Phone:', formData.phone || '-'],
    ['Registration Number:', formData.registrationNumber || '-'],
    ['Baccalaureate Year:', formData.baccalaureateYear || '-']
  ];
  
  personalInfo.forEach(([label, value]) => {
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(label, 20, yPosition);
    doc.setTextColor(51, 51, 51);
    doc.text(value, 80, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Academic Information Section
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text('Academic Information', 20, yPosition);
  yPosition += 12;
  
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  
  const academicInfo = [
    ['Faculty:', formData.faculty || '-'],
    ['Department:', formData.department || '-'],
    ['Skills:', formData.skills || '-']
  ];
  
  academicInfo.forEach(([label, value]) => {
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(label, 20, yPosition);
    doc.setTextColor(51, 51, 51);
    doc.text(value, 80, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Registration Details Section
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text('Registration Details', 20, yPosition);
  yPosition += 12;
  
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);
  
  const registrationInfo = [
    ['Registration Date:', new Date().toLocaleDateString()],
    ['Registration ID:', generateRegistrationId()]
  ];
  
  registrationInfo.forEach(([label, value]) => {
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(label, 20, yPosition);
    doc.setTextColor(51, 51, 51);
    doc.text(value, 80, yPosition);
    yPosition += 8;
  });
  
  // Footer
  yPosition += 20;
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 15;
  
  // Footer text
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, yPosition, { align: 'center' });
  
  // Add border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 280);
  
  // Save the PDF
  doc.save(`StepUp_Registration_Receipt_${formData.registrationNumber || 'Unknown'}.pdf`);
}

function collectFormDataForReceipt() {
  const form = document.getElementById('registrationForm');
  const formData = new FormData(form);
  
  return {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    registrationNumber: formData.get('registrationNumber'),
    baccalaureateYear: formData.get('baccalaureateYear'),
    faculty: formData.get('faculty'),
    department: formData.get('department'),
    skills: formData.get('skills')
  };
}

function populateReceiptData(formData) {
  // Populate receipt fields
  document.getElementById('receiptName').textContent = formData.fullName || '-';
  document.getElementById('receiptEmail').textContent = formData.email || '-';
  document.getElementById('receiptPhone').textContent = formData.phone || '-';
  document.getElementById('receiptRegNumber').textContent = formData.registrationNumber || '-';
  document.getElementById('receiptBacYear').textContent = formData.baccalaureateYear || '-';
  document.getElementById('receiptFaculty').textContent = formData.faculty || '-';
  document.getElementById('receiptDepartment').textContent = formData.department || '-';
  document.getElementById('receiptSkills').textContent = formData.skills || '-';
  document.getElementById('receiptDate').textContent = new Date().toLocaleDateString();
  document.getElementById('receiptId').textContent = generateRegistrationId();
  document.getElementById('receiptGeneratedDate').textContent = new Date().toLocaleString();
}

function generateRegistrationId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SUC${timestamp}${random}`;
}

function getReceiptStyles() {
  return `
    body {
      font-family: 'Times New Roman', serif;
      margin: 0;
      padding: 20px;
      background: white;
    }
    
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: white;
    }
    
    .receipt-header {
      text-align: center;
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    
    .receipt-title {
      font-size: 2rem;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 0.5rem;
    }
    
    .university-name {
      font-size: 1.2rem;
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 0.5rem;
    }
    
    .university-address {
      font-size: 1rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    
    .receipt-subtitle {
      font-size: 1.1rem;
      color: #333;
      margin-top: 1rem;
    }
    
    .receipt-content {
      margin-bottom: 2rem;
    }
    
    .receipt-section {
      margin-bottom: 1.5rem;
    }
    
    .receipt-section h4 {
      font-size: 1.1rem;
      font-weight: bold;
      color: #1e3a8a;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .receipt-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      padding: 0.25rem 0;
    }
    
    .receipt-item-label {
      font-weight: bold;
      color: #333;
      min-width: 150px;
    }
    
    .receipt-item-value {
      color: #666;
      flex: 1;
      text-align: right;
    }
    
    .receipt-footer {
      border-top: 2px solid #1e3a8a;
      padding-top: 1rem;
      text-align: center;
      margin-top: 2rem;
    }
    
    .receipt-date {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .receipt-signature {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
    }
    
    .signature-box {
      text-align: center;
      width: 200px;
    }
    
    .signature-line {
      border-bottom: 1px solid #333;
      height: 40px;
      margin-bottom: 0.5rem;
    }
    
    .signature-label {
      font-size: 0.9rem;
      color: #666;
    }
    
    @media print {
      body {
        background: white !important;
      }
    }
  `;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RegistrationSystem };
}
