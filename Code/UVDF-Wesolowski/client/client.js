// const socket = io.connect('http://localhost:3000/');

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
// Function to find next prime of a number
function nextPrime(num){
  var pp;
  if (bigInt(num).isOdd() === true){
    console.log("Odd")
    for (let i= bigInt(num); i< bigInt(num).multiply(2); i = bigInt(i).add(2)){
      if ((bigInt(i).mod(3) != 0) && (bigInt(i).mod(5) != 0) ){
        console.log("Hi there")
        if (bigInt(i).isPrime()){
          pp = i;
          break;
        }
      }
    }
  }
  else{
    console.log("Even")
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

var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123').toString();
 
//****** */
socket.on('send_m', (data) => {
  const m = data;
  socket.on('send_t', (data) => {
    var t = data;
    socket.on('send_N', (data) => {
      const N = data;
      socket.on('send_totient', (data) => {
        const totient = data;
        socket.on('send_lamda', (data) => {
          const lamda = bigInt(data);
          socket.on('send_d', (data) =>{
            const d = data;
            socket.on('send_k', (data) =>{
              const k = data;
              function sketch(xx, tt, yy, msg, kk){
                var alpha = [];
                var x_dash = 1; 
                var y_dash = 1;
                for (let i = 1; i<= kk; i++){
                  var alpha_one = bigInt(msg[i-1]).add(yy);
                  var alpha_dash = bigInt(alpha_one).mod(N);
                  var alpha_string = bigInt(alpha_dash).toString();
                  var alpha_hash = CryptoJS.SHA256(alpha_string)
                  alpha_hash.toString(CryptoJS.enc.Hex);
                  alpha[i] = bigInt(hextodec(alpha_hash)); 
                  x_dash = bigInt(x_dash).multiply(bigInt(msg[i-1]).modPow(alpha[i], N));
                  y_dash = bigInt(y_dash).multiply(bigInt(msg[i]).modPow(alpha[i], N));
                }
                return [x_dash, y_dash];
              };
              
              function prover(xx,tt,yy, kk,dd){
                yy = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                var x_y = bigInt(xx).add(yy);
                console.log("pp",yy, tt);
                var l = nextPrime(x_y);
                // var l = 3;
                var msg = [];
                msg[0] = xx;
                msg[k] = yy;
                for (let i = 1; i<kk; i++){
                  var pow = (bigInt(i).multiply(bigInt(tt))).divide(kk);
                  msg[i] = bigInt(xx).modPow(bigInt(2).modPow(pow, totient), N);
                }
                var xd_yd = sketch(xx, tt, yy, msg, kk);
                var x_dash = xd_yd[0];
                var y_dash = xd_yd[1];
                var proof_pow = bigInt(bigInt(2).modPow(bigInt(tt).divide(kk), totient)).divide(l);
                var proof_dash = bigInt(x_dash).modPow(proof_pow, N);
                var proof = [msg, proof_dash, x_dash, y_dash];
                
                return proof;
              };
              
              function verifier(xx,tt,yy, proof,kk, dd){
                var x_y = bigInt(xx).add(yy);
                var l = nextPrime(x_y);
                // var l = 3;
                var k_d = bigInt(kk).pow(dd);
                var y_res = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                if (bigInt(tt).lesser(k_d)){
                  if (bigInt(yy).equals(y_res)){
                    return ("Accepted");
                  }
                  else {
                    return ("Rejected");
                  }
                } else {
                  var msg = proof[0];
                  var proof_dash = proof[1];
                  // var xd_yd = sketch(xx, tt, yy, msg, kk);
                  var x_dash = proof[2];
                  var y_dash = proof[3];
                  var r = bigInt(2).modPow(bigInt(tt).divide(k), l);
                  var res_one = bigInt(proof_dash).modPow(l, N);
                  var res_two = bigInt(x_dash).modPow(r,N);
                  var res = bigInt(bigInt(res_one).multiply(res_two)).mod(N);
                  if (bigInt(res).equals(bigInt(y_dash).mod(N))){
                    return ("Accepted");
                  }
                  else {
                    return ("Rejected");
                  }
                }
              };
              
              function uvdf_eval(xx, tt, PP){
                var kk = PP[2];
                var dd = PP[3];
                var k_d = bigInt(kk).pow(dd);
                var yy;
                var proof;
                if (bigInt(tt).lesser(k_d)){
                  yy = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                  proof = null;
                  return [yy, null];
                }
                else{
                  yy = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                  proof= prover(xx, tt,yy, kk, dd);
                  return [yy, proof];
                }
              };
              
              function uvdf_verify(xx,tt,yy,proof,PP,kk,dd){
                var k_d = bigInt(kk).pow(dd);
                var y_res = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                if (bigInt(tt).lesser(k_d)){
                  if (bigInt(yy).equals(y_res)){
                    return ("Accepted");
                  }
                  else {
                    return ("Rejected");
                  }
                } else {
                  return verifier(xx, tt, yy, proof,kk,dd);
                }
              };
              
              var m_string = bigInt(m).toString();
              const hash = CryptoJS.SHA256(m_string)
              hash.toString(CryptoJS.enc.Hex);
              console.log("The hash of the message in string format is", hash);
              const x = bigInt(hextodec(hash)); // x <- H(m)
              console.log("The hash of the message is", x);
              var t_dash = bigInt(t).divide(k);
              var PP = [N, t, k, d];
              var eval = uvdf_eval(x,t,PP);
              var y = eval[0];
              var proof = eval[1];
              var result = uvdf_verify(x,t,y,proof,PP,k,d);
              console.log(result);
            });
          });
        });
      });
    });
  });
});




