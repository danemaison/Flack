document.addEventListener('DOMContentLoaded', ()=>{
  if (localStorage.getItem('username') != null){
    window.location = "/chatroom";
  }
  else{
    document.querySelector('#login').onsubmit = ()=>{
      const username = document.querySelector('#username').value;
      var allowed = true;
      if(username.includes(' ') == true){
        window.alert("Please do not use spaces in your username");
        allowed = false;
        document.querySelector('#username').value = "";
        return false;
      }
      else if(username.length > 11){
        window.alert("Please keep your display name under 12 characters")
        allowed = false;
        return false
      }
      if (allowed == true){
        localStorage.setItem('username',`${username}`);
        window.location = "/chatroom";
      }
      else{
        window.alert("Please try again.");
        return false;
      }
    }
  }
});
