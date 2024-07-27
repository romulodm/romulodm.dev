export default function greetingMessage() {
    const date = new Date();
    const hours = date.getHours();
    let content = '';
    if (hours < 3) {
      content = 'Good night';
    } else if (hours < 12) {
      content = 'Good morning';
    } else if (hours < 18) {
      content = 'Good afternoon';
    } else {
      content = 'Good evening';
    }
    return content;
  }