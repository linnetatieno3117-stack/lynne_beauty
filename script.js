let salonName="Lynne Beauty Saloon";
let service="hairstyling";
let price=1500;
let button=document.getElementById("bookBTN");
let message=document.getElementById("message");
let isVissible =false;

  button.onclick = function() {

    if (isVissible==false){
        message.innerHTML="Thank you for choosing Lynne Beauty salon!";
        message.style.display="block";
        isVissible=false;

    } else {
        message.style.display="non";
        isVissible=false;
    }   
   
  };
