select * from recipe, boilstep
where recipe.id = boilstep.idRicetta 
and recipe.id = 2
order by prog