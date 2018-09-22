/*
 * ProgressBar.cpp
 *
 *  Created on: Nov 9, 2017
 *      Author: mizio
 */
#include "ProgressBar.h"

	ProgressBar::ProgressBar (int lcd, int row, int col, uint8_t numCols){

	lcd_ = lcd;
	row_ = row;
	col_ = col;
	numCols_ = numCols;

  /* Enregistre les caractères personnalisés dans la mémoire de l'écran LCD */
	lcdCharDef(lcd_, 0, START_DIV_0_OF_1);
	lcdCharDef(lcd_, 1, START_DIV_1_OF_1);
	lcdCharDef(lcd_, 2, DIV_0_OF_2);
	lcdCharDef(lcd_, 3, DIV_1_OF_2);
	lcdCharDef(lcd_, 4, DIV_2_OF_2);
	lcdCharDef(lcd_, 5, END_DIV_0_OF_1);
	lcdCharDef(lcd_, 6, END_DIV_1_OF_1);

}

/**
 * Fonction dessinant la barre de progression.
 *
 * @param percent Le pourcentage à afficher.
 *
 */
void ProgressBar::draw(uint8_t percent, const char* lblLeft, const char* lblRight) {

	uint8_t i;
	uint8_t nb_columns;
	uint8_t lblLeftLen = strlen(lblLeft);
	uint8_t lblRighLen = strlen(lblRight);

	lcdPosition(lcd_, col_, row_);

	/* Map la plage (0 ~ 100) vers la plage (0 ~ uint8_t * 2 - 2) */
	nb_columns = map(percent, 0, 100, 0, (numCols_ * 2) - 2);

	// Chaque caractére affiche 2 barres verticales, mais le premier et dernier caractére n'en affiche qu'une.

	/* Dessine chaque caractére de la ligne */
	for (i = 0; i < numCols_; ++i) {

		if (i == 0) { // Premiére case

		  /* Affiche le char de début en fonction du nombre de colonnes */
		  if (nb_columns > 0) {
			  lcdPutchar (lcd_, 1); // Char début 1 / 1
			nb_columns -= 1;

		  } else {
			  lcdPutchar (lcd_, 0); // Char début 0 / 1
		  }

		} else if (i == numCols_ -1) { // Derniére case

		  /* Affiche le char de fin en fonction du nombre de colonnes */
		  if (nb_columns > 0) {
			  lcdPutchar (lcd_, 6); // Char fin 1 / 1

		  } else {
			lcdPutchar (lcd_, 5); // Char fin 0 / 1
		  }

		} else { // Autres cases

		  /* Affiche le char adéquat en fonction du nombre de colonnes */
		  if (nb_columns >= 2) {
			  lcdPutchar (lcd_, 4); // Char div 2 / 2
			nb_columns -= 2;

		  } else if (nb_columns == 1) {
			  lcdPutchar (lcd_, 3); // Char div 1 / 2
			nb_columns -= 1;

		  } else {
			  lcdPutchar (lcd_, 2); // Char div 0 / 2
		  }
		}
	}

	// Stampo la label di sinistra
	lcdPosition(lcd_, col_, row_ + 1);
	lcdPuts(lcd_, lblLeft);

	// Stampo la %
	lcdPosition(lcd_, col_ + (numCols_ / 2) - 3 , row_+1);
	lcdPrintf(lcd_, "%3d %%", percent);

	// Stampo la label di destra
	lcdPosition(lcd_, col_ + numCols_ - lblRighLen, row_+1);
	lcdPuts(lcd_, lblRight);

}

/* Map la plage (0 ~ 100) vers la plage (0 ~ uint8_t * 2 - 2) */
uint8_t ProgressBar::map(uint8_t x, uint8_t in_min, uint8_t in_max, uint8_t out_min, uint8_t out_max)
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
