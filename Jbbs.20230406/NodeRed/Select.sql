// Select Recipe

select * from Recipe

// Select Mash step
var id = msg.payload.id;

msg.topic = "select s.*, r.desc as 'ricetta' ";
msg.topic += " from step as s ";
msg.topic += " inner join recipe as r ";
msg.topic += " on s.idRicetta =r.id ";
msg.topic += " where s.idRicetta=" + id;
msg.topic += " order by prog;";


// Select Boil step
var id = msg.payload.id;

msg.topic = "select * ";
msg.topic += " from boilstep ";
msg.topic += " where idRicetta=" + id;
msg.topic += " order by prog;";
return (msg);