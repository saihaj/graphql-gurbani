import { Shabads } from '@shabados/database'
import { toUnicode, toAscii } from 'gurmukhi-utils'

import { textLarivaar, stripVishraams, getTranslation, getTransliteration } from './tools'
import { punjabiSources, englishSources, spanishSources } from './translationSources'

/**
 * Get Shabad from Shabad id
 * @param {string} shabadId The ID of the Shabad to query.
 * @async
 */
const getShabad = async shabadId => {
  const shabadData = await Shabads.query()
    .where( 'shabads.id', shabadId )
    .eager( '[writer, section, source, lines]' )
    .withTranslations()
    .withTransliterations()
    .then( ( [ shabad ] ) => shabad )

  const [ previousShabad ] = await Shabads.query()
    .select( 'id' )
    .where( 'order_id', shabadData.orderId - 1 )
  const [ nextShabad ] = await Shabads.query()
    .select( 'id' )
    .where( 'order_id', shabadData.orderId + 1 )

  const shabadLines = {
    shabadinfo: {
      shabadid: shabadData.id,
      pageno: shabadData.lines[ 0 ].sourcePage,
      source: {
        id: shabadData.source.id,
        akhar: shabadData.source.nameGurmukhi,
        unicode: toUnicode( shabadData.source.nameGurmukhi ),
        english: shabadData.source.nameEnglish,
        length: shabadData.source.length,
        pageName: {
          akhar: shabadData.source.pageNameGurmukhi,
          unicode: toUnicode( shabadData.source.pageNameGurmukhi ),
          english: shabadData.source.pageNameEnglish,
        },
      },
      writer: {
        id: shabadData.writer.id,
        akhar: shabadData.writer.nameGurmukhi,
        unicode: toUnicode( shabadData.writer.nameGurmukhi ),
        english: shabadData.writer.nameEnglish,
      },
      raag: {
        id: shabadData.section.id,
        akhar: shabadData.section.nameGurmukhi,
        unicode: toUnicode( shabadData.section.nameGurmukhi ),
        english: shabadData.section.nameEnglish,
        startang: shabadData.section.startPage,
        endang: shabadData.section.endPage,
        raagwithpage: `${shabadData.section.nameEnglish} (${shabadData.section.startPage}-${shabadData.section.endPage})`,
      },
      navigation: {
        previous: previousShabad,
        next: nextShabad,
      },
      count: shabadData.lines.length,
    },
    shabad: [],
  }

  shabadLines.shabad = shabadData.lines.reduce( ( lines, line ) => ( [
    ...lines,
    {
      line: {
        id: line.id,
        gurmukhi: {
          akhar: stripVishraams( line.gurmukhi ),
          unicode: toUnicode( stripVishraams( line.gurmukhi ) ),
        },
        larivaar: {
          akhar: textLarivaar( stripVishraams( line.gurmukhi ) ),
          unicode: textLarivaar( toUnicode( stripVishraams( line.gurmukhi ) ) ),
        },
        translation: {
          english: getTranslation( line.translations, englishSources ),
          punjabi: {
            akhar: toAscii( getTranslation( line.translations, punjabiSources ) ),
            unicode: getTranslation( line.translations, punjabiSources ),
          },
          spanish: getTranslation( line.translations, spanishSources ),
        },
        transliteration: {
          english: {
            text: stripVishraams(
              getTransliteration( line.transliterations, 1 ),
            ),
            larivaar: textLarivaar(
              stripVishraams( getTransliteration( line.transliterations, 1 ) ),
            ),
          },
          devanagari: {
            text: stripVishraams(
              getTransliteration( line.transliterations, 4 ),
            ),
            larivaar: textLarivaar(
              stripVishraams( getTransliteration( line.transliterations, 4 ) ),
            ),
          },
          urdu: {
            text: stripVishraams(
              getTransliteration( line.transliterations, 5 ),
            ),
            larivaar: textLarivaar(
              stripVishraams( getTransliteration( line.transliterations, 5 ) ),
            ),
          },
        },
        lineNum: line.sourceLine,
        firstletters: {
          akhar: line.firstLetters,
          unicode: toUnicode( line.firstLetters ),
        },
      },
    },
  ] ), [] )

  return shabadLines
}

export default getShabad
