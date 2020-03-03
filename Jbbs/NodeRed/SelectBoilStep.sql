var id = msg.payload.id;

msg.topic = "select * ";
msg.topic += " from boilstep ";
msg.topic += " where idRicetta=" + id;
msg.topic += " order by prog;";
return (msg);