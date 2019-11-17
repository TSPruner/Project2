document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('change').style.display = 'none';  
    document.getElementById('chan-submit').style.display = 'none';

    // display user name if stored, otherwise allow user to enter
    if (!localStorage.getItem('name')) {
        document.getElementById('channel-card').style.display = 'none';
        document.getElementById('channel').style.display = 'none';
    }
    else {
        displayName(localStorage.getItem('name'));
    }

    document.querySelector('#name-submit').disabled = true;
    document.getElementById('channel-title').style.display = 'none';  
    document.getElementById('usermsg').style.display = 'none';    
    document.getElementById('msg-submit').style.display = 'none';   
    document.getElementById('chan-messages').style.display = 'none';   
    document.getElementById('message').style.display = 'none';   
    document.getElementById('card-two').style.display = 'none';
    document.getElementById('msg-delete').style.display = 'none';

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // When connected, configure buttons
    socket.on('connect', () => {
            
        // display channel name if stored, otherwise allow user to select
        checkForChanSelection();

        document.querySelector('#chan-submit').disabled = true;
        document.querySelector('#msg-submit').disabled = true;
        document.querySelector('#msg-delete').disabled = true;

        // Enable add channel button only if there is text in the input field
        document.querySelector('#channel').onkeyup = () => {
            if (document.querySelector('#channel').value.length > 0)
                document.querySelector('#chan-submit').disabled = false;
            else
                document.querySelector('#chan-submit').disabled = true;
        };
        
        // Enable add message button only if there is text in the input field
        document.querySelector('#message').onkeyup = () => {
            if (document.querySelector('#message').value.length > 0)
                document.querySelector('#msg-submit').disabled = false;
            else
                document.querySelector('#msg-submit').disabled = true;
        };
        
        document.querySelector('#add-channel').onsubmit = () => {
            // Add channel
            const new_channel = document.querySelector('#channel').value;

            document.querySelector('#channel').value = '';
            document.getElementById('change').style.display = 'block';

            socket.emit('create channel', new_channel);

            // Stop form from submitting
            return false; 
            
        };
                
        document.querySelector('#add-message').onsubmit = () => {
            // Add message
            const msg_text = document.querySelector('#message').value;
            const selection = localStorage.getItem('channel');
            const username = localStorage.getItem('name');
            var new_message = [];
            new_message[0] = {chan: selection};
            new_message[1] = {name: username};
            new_message[2] = {text: msg_text};
   
            document.querySelector('#message').value = '';

            socket.emit('create message', new_message);

            document.querySelector('#msg-submit').disabled = true;
            document.querySelector('#msg-delete').disabled = false;

            // Stop form from submitting
            return false; 

        };
                        
        document.querySelector('#msg-delete').onclick = () => {
            // Add message
            const selection = localStorage.getItem('channel');
            const username = localStorage.getItem('name');
            var new_message = [];
            new_message[0] = {chan: selection};
            new_message[1] = {name: username};

            socket.emit('delete messages', new_message);

            document.querySelector('#msg-delete').disabled = true;

            // Stop form from submitting
            return false; 

        };
        
        // get and display user name when entered
        document.querySelector('#new-user').onsubmit = () => {
            // get name entered by user
            const user_name = document.querySelector('#name').value;

            // save user name in storage
            localStorage.setItem('name', user_name);
            displayName(user_name);

            // show channels, in case there are some already created
            checkForChanSelection();
        
            // Stop form from submitting
            return false; 
        };
    });
   
    function checkforRadioButtons (channel) {
        var ele = document.getElementsByName('selection');

        for (var i = 0; i < ele.length; i++) { 
            if (channel == ele[i].value)
                ele[i].checked = true;
        }
    }

    function checkForChanSelection () {
        // display channel name if stored, otherwise allow user to select
        if (localStorage.getItem('channel')) {
            var chan_selected = localStorage.getItem('channel');
            checkforRadioButtons(chan_selected);
                                    
            // if user, then show channels and messages
            if (localStorage.getItem('name')) {
                socket.emit('display all', chan_selected);
            }
        }
        else {
            if (localStorage.getItem('name')) 
                socket.emit('show channels');
        }
    }
    
    function showChannelInfo (data) {
        var chan_doc = document.getElementById('new-channel');
        var new_list = document.getElementsByName('selection');
        var count;
        if (new_list)
            count = new_list.length;

        for (var i = 0; i < data.length; i++) { 
            document.getElementById('change').style.display = 'block';  

            var new_chan = document.createElement("input");
            new_chan.type = "radio";
            new_chan.name = "selection";
            new_chan.id = data[i];
            new_chan.value =  data[i];
            new_chan.className = "form-check-input";

            var chan_label = document.createElement("label");
            chan_label.className = "form-check-label";
            chan_label.appendChild(new_chan);
            chan_label.innerHTML = data[i];
            
            if (count <= i) {
                chan_doc.appendChild(new_chan);
                chan_doc.appendChild(chan_label);    
                chan_doc.appendChild(document.createElement('br'));    
            }   
        }
        
        var chan_selected = localStorage.getItem('channel');
        if ((count == 0) && chan_selected) 
            checkforRadioButtons(chan_selected);
        
    }

    socket.on('show data', data => {
        // show messages for selected channel, if any
        if (data) {
            var chan = data[0];
            var selection = chan["chan"];
            var data_text = data[1]
            var channels = data_text["text"]

            if (localStorage.getItem('name')) {
                showChannelInfo(channels);
                displayChannel(selection);
                socket.emit('show messages', selection);
            }
        }

        // Stop form from submitting
        return false;
    });

    // When a new message is announced, display all messages
    socket.on('channel messages', data => {
        if (data) {
            var chan = data[0];
            var selection = chan["chan"];
            var message_text = data[1]
            var message = message_text["text"]


            if (localStorage.getItem('channel')) {
                displayTitle(selection);
                displayMessages(selection, message);
            }
        }
        else{
            var message = "Error: channel not found!"
            alert(message);
        }

        // Stop form from submitting
        return false;
    });

    // When a set of messages is removed, display all remaining messages
    socket.on('deleted messages', data => {
        if (data) {
            var chan = data[0];
            var selection = chan["chan"];
            var msg = data[1];
            var alert_message = msg["msg"];
            var message_text = data[2]
            var message = message_text["text"]

            if (localStorage.getItem('channel')) {
                displayTitle(selection);
                displayMessages(selection, message);

                alert(alert_message);
            }
        }
        else{
            var message = "Error: messages removal failed!"
            alert(message);
        }

        // Stop form from submitting
        return false;
    });

    // When a new channel is announced, display all channels
    socket.on('channel names', data => {
        if (data) {
            if (localStorage.getItem('name')) 
                showChannelInfo(data);
        }
        else{
            var message = "Error: channel already exists!";
            alert(message);
        }

        // Stop form from submitting
        return false;
    });

    // Enable user name button only if there is text in the input field
    document.querySelector('#name').onkeyup = () => {
        if (document.querySelector('#name').value.length > 0)
            document.querySelector('#name-submit').disabled = false;
        else
            document.querySelector('#name-submit').disabled = true;
    };
    
    // get and display user name when entered
    document.querySelector('#new-user').onsubmit = () => {
        // get name entered by user
        const user_name = document.querySelector('#name').value;

        // save user name in storage
        localStorage.setItem('name', user_name);
        displayName(user_name);

        // show channels, in case there are some already created
        checkForChanSelection();
    
        // Stop form from submitting
        return false; 
    };

    function displayTitle (channel) {
        var title = document.getElementById('channel-title');
        title.innerHTML = "User messages for: ";
        title.style.color = 'teal';
        title.style.fontStyle = 'bold';

        var value = document.getElementById('channel-value');
        value.innerHTML = channel;
        value.innerHTML += "<br/>";
        value.style.color = 'black';
        value.style.fontStyle = 'bold';
        
        document.getElementById('msg-delete').style.display = 'block';
    }
        
    function displayMessages (selection, msg_list) {
        var channel = localStorage.getItem('channel');

        // only update if user has this channel selected
        if (channel == selection) {
            var ul = document.getElementById('new-message');
    
            removeMessages(selection);

            for (var i = 0; i < msg_list.length; i++) { 
                var li = document.createElement("li");

                li.setAttribute('id', "user-message");
                li.appendChild(document.createTextNode(msg_list[i]));
                li.innerHTML = msg_list[i];

                if ((i % 2) == 0) 
                    li.style.color = 'lightseagreen';
                ul.appendChild(li);
            }
        }
    }

    function displayName (name) {
        document.querySelector('.user').innerHTML = name;
        document.getElementById('name').style.display = 'none';
        document.getElementById('name-submit').style.display = 'none';

        var ele = document.getElementsByName('selection'); 
        if (ele.length > 0)
            document.getElementById('change').style.display = 'block';   

        document.getElementById('channel-card').style.display = 'block';
        document.getElementById('channel').style.display = 'block';
    }

    function displayChannel (selection) {
        document.getElementById('channel-title').style.display = 'block';  
        document.querySelector('#channel-title').innerHTML = "User messages for";
        document.querySelector('#channel-value').innerHTML = selection + "<br/>"
        
        document.getElementById('msg-delete').style.display = 'block';
        document.getElementById('change').style.display = 'block';    
        document.getElementById('usermsg').style.display = 'block';  
        document.getElementById('msg-submit').style.display = 'block';  
        document.getElementById('chan-messages').style.display = 'block';   
        document.getElementById('message').style.display = 'block';   
        document.getElementById('card-two').style.display = 'block';
    }

    function removeMessages (selection) {
        if (selection) {
            // clear out any existing messages on screen
            var ul = document.getElementById('new-message');
            var count = 0;

            if (ul)
                count = ul.childElementCount;
        
            for (var i = 0; i < count; i++) { 
                ul.removeChild(ul.childNodes[0]);
            }
        }
    }

    document.querySelector('#change').onclick = () => {
        var ele = document.getElementsByName('selection'); 
        var current_chan = localStorage.getItem('channel');

        removeMessages(current_chan);

        for (var i = 0; i < ele.length; i++) { 
            if (ele[i].checked) { 
                // get user selection
                const chan_selected = ele[i].value;

                displayChannel(chan_selected);

                // save user name in storage
                localStorage.setItem('channel', chan_selected);

                socket.emit('display all', chan_selected);

                return false; 
            }
        }
    };

});