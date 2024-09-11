let zoomIndex=1;
            let selectedX=-1;
            let selectedY=-1;
            let selectedColor="";
            let selectedPixelId = -1;

            window.onload = function() {
              loadGrid();
            };

            let mouseDown = false;
            let mouseMoved = false;
            let startX, scrollLeft;
            let starty, scrollTop;
            const slider = document.querySelector('#MainContainer');

            const startDragging = (e) => {
              mouseDown = true;
              startX = e.pageX - slider.offsetLeft;
              startY = e.pageY - slider.offsetTop;
              scrollLeft = slider.scrollLeft;
              scrollTop = slider.scrollTop;
            }

            const stopDragging = (e) => {
              mouseDown = false;
            }

            const move = (e) => {
              e.preventDefault();
              if(!mouseDown) { return; }
              const x = e.pageX - slider.offsetLeft;
              const scrollX = x - startX;
              slider.scrollLeft = scrollLeft - scrollX;
              const y = e.pageY - slider.offsetTop;
              const scrollY = y - startY;
              slider.scrollTop = scrollTop - scrollY;
              mouseMoved = true;
            }

            // Add the event listeners
            slider.addEventListener('mousemove', move, false);
            slider.addEventListener('mousedown', startDragging, false);
            slider.addEventListener('mouseup', stopDragging, false);
            slider.addEventListener('mouseleave', stopDragging, false);


            function ValidateColor(){
                $.ajax({url: 'ValidateColors?pixelId='+selectedPixelId+'&color='+selectedColor, success:function(res){
                  alert('server response is'+ res);
                }});


                const selectedPixel = document.getElementById("x"+selectedX+"y"+selectedY);
                selectedPixel.className = '';
                selectedPixel.classList.add("button");
                selectedPixel.classList.add(selectedColor);
                selectedPixel.classList.add("pixelSelected");
            }


            function clickColor(color){

                let selectedButton = null;
                
                const validateBtn = document.getElementById("btnValidateColor");
                validateBtn.disabled = false;

                var elements = document.getElementsByClassName("btnSelected");
                for(var i = elements.length - 1; i >= 0; --i)
                {
                    elements[i].classList.remove("btnSelected");
                }   

                switch(color) {
                          case "White":
                            selectedButton = document.getElementById("btnWhite");
                            selectedColor="white";
                            break;
                          case "Black":
                            selectedButton = document.getElementById("btnBlack");
                            selectedColor="black";
                            break;
                          case "Grey":
                            selectedButton = document.getElementById("btnGrey");
                            selectedColor="grey";
                            break;
                          case "Red":
                            selectedButton = document.getElementById("btnRed");
                            selectedColor="red";
                            break;
                          case "Green":
                            selectedButton = document.getElementById("btnGreen");
                            selectedColor="green";
                            break;
                          case "Blue":
                            selectedButton = document.getElementById("btnBlue");
                            selectedColor="blue";
                            break;
                          case "Yellow":
                            selectedButton = document.getElementById("btnYellow");
                            selectedColor="yellow";
                            break;
                          case "Purple":
                            selectedButton = document.getElementById("btnPurple");
                            selectedColor="purple";
                            break;
                          default:
                            // code block
                        } 

                selectedButton.classList.add("btnSelected");
            }




            function zoom()
            {
                oldZoomIndex = zoomIndex;

                if(zoomIndex<4)
                {
                    zoomIndex ++;
                }
                const mainContainer = document.getElementById("MainContainer");
                const movableDiv = document.getElementById("Movable");

                mainContainer.classList.remove("zoom1");
                mainContainer.classList.remove("zoom2");
                mainContainer.classList.remove("zoom3");
                mainContainer.classList.remove("zoom4");

                movableDiv.classList.remove("zoom1");
                movableDiv.classList.remove("zoom2");
                movableDiv.classList.remove("zoom3");
                movableDiv.classList.remove("zoom4");

                mainContainer.classList.add("zoom"+zoomIndex);
                movableDiv.classList.add("zoom"+zoomIndex);

                var elements = document.getElementsByClassName("row zoom"+oldZoomIndex);
                for(var i = elements.length - 1; i >= 0; --i)
                {
                    elements[i].className = "row zoom"+zoomIndex;
                }   

                var pixels = document.getElementsByClassName("button");
                for(var i = pixels.length - 1; i >= 0; --i)
                {
                    pixels[i].classList.add("zoomed");
                }   
            }



            function unzoom()
            {
                oldZoomIndex = zoomIndex;

                if(zoomIndex>1)
                {
                    zoomIndex --;
                }
                const mainContainer = document.getElementById("MainContainer");
                const movableDiv = document.getElementById("Movable");

                mainContainer.classList.remove("zoom1");
                mainContainer.classList.remove("zoom2");
                mainContainer.classList.remove("zoom3");
                mainContainer.classList.remove("zoom4");

                movableDiv.classList.remove("zoom1");
                movableDiv.classList.remove("zoom2");
                movableDiv.classList.remove("zoom3");
                movableDiv.classList.remove("zoom4");

                mainContainer.classList.add("zoom"+zoomIndex);
                movableDiv.classList.add("zoom"+zoomIndex);

                var elements = document.getElementsByClassName("row zoom"+oldZoomIndex);
                for(var i = elements.length - 1; i >= 0; --i)
                {
                    elements[i].className = "row zoom"+zoomIndex;
                }   

                if(zoomIndex == 1)
                {
                    var pixels = document.getElementsByClassName("zoomed");
                    for(var i = pixels.length - 1; i >= 0; --i)
                    {
                        pixels[i].classList.remove("zoomed");
                    }   
                }
            }




            function clickPixel(x,y,pixelId)
            {
                selectedX = x;
                selectedY = y;
                selectedPixelId = pixelId;

                const modalDiv = document.getElementById("Modal");
                modalDiv.style.display = 'block'; 

                document.getElementById("btnValidateColor").disabled = true; 

                if(!mouseMoved){
                    const pixelColors = document.getElementById("PixelColors");
                    pixelColors.innerHTML ="";
                    pixelColors.appendChild(document.createTextNode("You selected following coordinates : x"+x+"y"+y));

                    var pixels = document.getElementsByClassName("pixelSelected");
                    for(var i = pixels.length - 1; i >= 0; --i)
                    {
                        pixels[i].classList.remove("pixelSelected");
                    }   

                    const selectedPixel = document.getElementById("x"+x+"y"+y);
                    selectedPixel.classList.add("pixelSelected");

                    var btnSelected = document.getElementsByClassName("btnSelected");
                    for(var i = btnSelected.length - 1; i >= 0; --i)
                    {
                        btnSelected[i].classList.remove("btnSelected");
                    }   
                }
                else{
                    mouseMoved = false;    
                }
            }



            function loadGrid()
            {
                let pixelList;
                
                fetch('nexapixels.json')
                  .then(response => response.text())
                  .then((data) => {
                    pixelList = JSON.parse(data)
                  })
                
                const movableDiv = document.getElementById("Movable");

                let x=0;
                let y=0;
                let pixelId=0;
                while (y < 8) {
                    const row = document.createElement('div');
                    row.setAttribute('id', "y"+y);
                    row.classList.add("row");
                    row.classList.add("zoom1");

                    while (x < 8) {
                        const newButton = document.createElement('button');
                        newButton.setAttribute('id', "x"+x+"y"+y);
                        newButton.classList.add("button");
                        newButton.setAttribute("onclick","clickPixel("+x+","+y+","+pixelId+");");

                        switch(pixelList[pixelId].color) {
                          case 'white':
                            newButton.classList.add("white");
                            break;
                          case 'black':
                            newButton.classList.add("black");
                            break;
                          case 'grey':
                            newButton.classList.add("grey");
                            break;
                          case 'red':
                            newButton.classList.add("red");
                            break;
                          case 'green':
                            newButton.classList.add("green");
                            break;
                          case 'blue':
                            newButton.classList.add("blue");
                            break;
                          case 'yellow':
                            newButton.classList.add("yellow");
                            break;
                          case 'purple':
                            newButton.classList.add("purple");
                            break;
                          default:
                            newButton.classList.add("white");
                            break;
                        } 

                        row.appendChild(newButton);
                        x++;
                        pixelId++;
                    }

                    movableDiv.appendChild(row);
                    x=0;
                    y++;
                }
            }
