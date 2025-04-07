document.addEventListener('DOMContentLoaded', function() {
  const questionForm = document.querySelector('.question-form');
  const formTitle = document.querySelector('.form-input');
  const formContent = document.querySelector('.form-textarea');
  const formCategory = document.querySelector('.form-select');
  const formSubmitButton = document.querySelector('.button-primary');
  
  // Submit form handler
  if (formSubmitButton) {
    formSubmitButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Validate form fields
      if (!formTitle.value.trim()) {
        alert('Please enter a title');
        return;
      }
      
      if (!formContent.value.trim()) {
        alert('Please enter content');
        return;
      }
      
      if (!formCategory.value || formCategory.value === '') {
        alert('Please select a category');
        return;
      }
      
      // Create question object
      const newQuestion = {
        title: formTitle.value.trim(),
        content: formContent.value.trim(),
        tag: formCategory.value,
        username: 'Anonymous User',
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        views: 0,
        comments: 0,
        votes: 0,
        closed: false
      };
      
      saveNewQuestion(newQuestion);
      
      alert('Your question has been submitted successfully!');
      window.location.href = '/src/pages/forum-page.html?content=questions';
    });
  }
  
  // Function to save a new question to localStorage
  function saveNewQuestion(question) {
    let questions = JSON.parse(localStorage.getItem('forumQuestions')) || [];
    
    // Add new question
    questions.unshift(question);
    
    // Save back to localStorage
    localStorage.setItem('forumQuestions', JSON.stringify(questions));
  }
  
  // Add image button functionality
  const addImageButton = document.querySelector('.button-secondary');
  if (addImageButton) {
    addImageButton.addEventListener('click', function() {
      alert('Image upload functionality would be implemented here');
    });
  }
});