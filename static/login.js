$(document).ready(init)

function int(){
  $('.form').on('submit', function(event){
    return false;  
  });
  
  $('.join').on('click', function(){
      var username = document.querySelector('.username').value;
      var allowed = true;
//       if (username.match(/^[0-9a-zA-Z]{1,16}$/)){
//         allowed = true;
//       }
//       else{
//         window.alert("Please do not use spaces or symbols in your username")
//         allowed = false;
//         document.querySelector('.username').value = "";
//         return false;
//       }

//       if(username.length > 11){
//         window.alert("Please keep your display name under 12 characters")
//         allowed = false;
//         return false
//       }

      if (allowed == true){
        localStorage.setItem('username',`${username}`);
        window.location = "/chatroom";
      }
      else{
        window.alert("Please try again.");
        return false;
      }
  });

}


