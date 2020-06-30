// the (burgerlines) parameter represent the DOM element that has been given to the function
function myFunction(burgerlines) {
  burgerlines.classList.toggle('change');

  var reponsiveNavElement = document.getElementById('responsivenav');
    if (reponsiveNavElement.className === 'header') {
      reponsiveNavElement.classList.add('responsive')
    } else {
      reponsiveNavElement.className = 'header';
    }
  }
