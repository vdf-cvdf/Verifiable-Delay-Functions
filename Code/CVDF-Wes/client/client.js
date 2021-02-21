/*************** Stronger CVDF ****************/
var socket = io.connect('http://localhost:3000/', {
    reconnection: false
});

socket.on('connect', () => {
  console.log('Successfully connected!');
});

// Function to convert hex values to decimal
function hextodec(hex_value){
  if (hex_value.length % 2) { hex_value = '0' + hex_value; }
  var bn = BigInt('0x' + hex_value);
  var d = bn.toString(10);
  return d;
};

// Function to generate next-prime of a number
function nextPrime(num){
  var pp;
  if (bigInt(num).isOdd() === true){
    for (let i= bigInt(num); i< bigInt(num).multiply(2); i = bigInt(i).add(2)){
      if ((bigInt(i).mod(3) != 0) && (bigInt(i).mod(5) != 0) ){
        if (bigInt(i).isPrime()){
          pp = i;
          break;
        }
      }
    }
  }
  else{
    num = bigInt(num).add(1);
    for (let i= bigInt(num); i< bigInt(num).multiply(2); i = bigInt(i).add(2)){
      if ((bigInt(i).mod(3) != 0) && (bigInt(i).mod(5) != 0) ){
        if (bigInt(i).isPrime()){
          pp = i;
          break;
        }
      }
    }
  }
  return pp;
};

socket.on('send_m', (data) => {
  const m = data;
  socket.on('send_t', (data) => {
    const t = data;
    socket.on('send_N', (data) => {
      const N = data;
      socket.on('send_totient', (data) => {
        const totient = data;
        socket.on('send_lamda', (data) => {
          const lamda = bigInt(data);
          var m_string = bigInt(m).toString();
          // *************** Evaluation ****************
          function Eval(xm_string, T, b){
            const hash = CryptoJS.SHA256(xm_string);
            hash.toString(CryptoJS.enc.Hex);
            var g = bigInt(hextodec(hash)); // x <- H(m)
            if (T< b){
              var xpow = bigInt(2).modPow(T, totient);
              y = bigInt(g).modPow(xpow, N); //generate y 
              var g_y = bigInt(g).add(y); 
              var l = nextPrime(g_y);
              var l1 = bigInt(xpow).divide(l);
              var q = bigInt(l1).mod(totient);
              proof = bigInt(g).modPow(q, N);
            }
            else{
              for (let i = 1; i<= b; i++){
                if (i == 1){
                  var x1 = g;
                  var T_half = bigInt(T).divide(b);
                  var y1;
                  var proof1;
                  y1, proof1, g = Eval(x1, T_half, b);
                }
                else{
                  var T_half = bigInt(T).divide(b);
                  var powminus = bigInt(i).minus(1)
                  var Tpow = bigInt(powminus).multiply(T_half);
                  var x1 = bigInt(g).modPow(Tpow, N);
                  var y1;
                  var proof1;
                  y1, proof1, g = Eval(x1, T_half,b);
                };
              };
            };
            return (y, proof1,g);
          }
          var b = 4;
          var y;
          var proof;
          var x;
          y, proof,x = Eval(m_string, t,b); // Calling Eval function 
          socket.emit('send_x', x);
          socket.emit('send_y', y);
          socket.emit('send_proof', proof);
          socket.emit('send_b', b);
        });
      });
    });
  });
});


