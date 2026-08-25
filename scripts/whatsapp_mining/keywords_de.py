"""Deutsche Keyword-Taxonomie und Stoppwortliste fuer die Relevanz-Bewertung.

Bewusst hohe Recall- vor Precision-Gewichtung: ein falscher Treffer kostet nichts
(Claude verwirft ihn bei der Synthese), ein uebersehener ist unwiederbringlich, da
Claude die Rohdaten nie sieht. Keine Negations- oder Sarkasmus-Erkennung.
"""
from __future__ import annotations

import re

# Kategorie -> (Gewicht, [kompilierte Regex-Muster])
# A: expliziter Feature-Wunsch, B: Beschwerde/Frustration, C: generische App-Vokabel,
# D: Bezug zu Alt-Apps/Legacy, E: Feature-Domaenenbegriffe (je Feature-Praefix).

_RAW_PATTERNS: dict[str, tuple[int, list[str]]] = {
    "A": (
        3,
        [
            r"w[aä]re (?:doch|ja|echt|mega|voll|schon )?(?:cool|geil|nice|gut|sch[oö]n|toll|super|klasse|praktisch)\w{0,3} wenn",
            r"w[uü]rde\w{0,2} (?:mir|mich|uns)? ?(?:sehr |echt |total )?(?:freuen|w[uü]nschen)",
            r"w[uü]nsch\w{0,3} mir",
            r"sollte\w{0,2} (?:die app|es|man)",
            r"k[oö]nnte\w{0,2} man",
            r"man k[oö]nnte",
            r"w[aä]re (?:es )?(?:nicht )?(?:m[oö]glich|machbar|denkbar)",
            r"g[aä]be es die m[oö]glichkeit",
            r"br[aä]uchte\w{0,2} (?:man|wir|ich)",
            r"\bfehlt\b",
            r"\bvermisse\b",
            r"gute idee",
            r"\bidee\b",
            r"\bvorschlag\b",
            r"feature request",
            r"wieso gibt es (?:keine|kein)",
            r"warum gibt es (?:keine|kein)",
            r"gibt es (?:schon )?(?:eine app|sowas|so ?etwas)",
            r"plant ihr",
            r"ist (?:das )?geplant",
            r"w[aä]re (?:mal )?praktisch",
        ],
    ),
    "B": (
        3,
        [
            r"\bnervt\b",
            r"nervig",
            r"\bbugs?\b",
            r"\bfehler\b",
            r"funktioniert nicht",
            r"geht (?:gerade )?nicht",
            r"\bkaputt\b",
            r"\bspinnt\b",
            r"un[uü]bersichtlich",
            r"kompliziert",
            r"umst[aä]ndlich",
            r"\bveraltet\b",
            r"abgest[uü]rzt",
            r"\bcrash\w{0,3}\b",
            r"l[aä]dt (?:nicht|ewig|nie)",
            r"schlechte app",
            r"schei[ßss].?app",
        ],
    ),
    "C": (
        1,
        [
            r"\bapp\b",
            r"\bfunktion\b",
            r"\bfeature\b",
            r"\bupdate\b",
            r"einstellung\w{0,2}",
            r"benachrichtigung\w{0,2}",
            r"\bpush\b",
        ],
    ),
    "D": (
        3,
        [
            r"\balte app\b",
            r"fb4.?app",
            r"\bods\b",
            r"hisinone",
            r"stundenplan.?app",
            r"mensa.?app",
        ],
    ),
    "E": (
        1,
        [
            # SHELL
            r"dark ?mode",
            r"startbildschirm",
            r"\bnavigation\b",
            # RAUM
            r"raum frei",
            r"freien raum",
            r"welcher raum",
            r"raum\w{0,4}such",
            r"wo ist (?:der )?raum",
            # SCHED
            r"stundenplan",
            r"vorlesungsplan",
            # MENSA
            r"\bmensa\b",
            r"speiseplan",
            # RATE
            r"mensa.{0,15}bewert",
            r"bewert.{0,15}mensa",
            # NEWS
            r"\bnews\b",
            r"ank[uü]ndigung",
            # EVENT
            r"\bevent\b",
            r"veranstaltung",
            # HELFER
            r"\bhelfer\b",
            r"helfen beim",
            # WIKI
            r"\bwiki\b",
            r"bookstack",
            # TICKET
            r"semesterticket",
            # NOTEN
            r"\bnoten\b",
            r"klausurergebnis",
            r"pr[uü]fungsergebnis",
        ],
    ),
}

CATEGORY_WEIGHTS: dict[str, int] = {cat: weight for cat, (weight, _) in _RAW_PATTERNS.items()}

CATEGORY_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    cat: [re.compile(p, re.IGNORECASE) for p in patterns]
    for cat, (_, patterns) in _RAW_PATTERNS.items()
}

POLL_BONUS = 2
MAX_HITS_PER_CATEGORY = 2

# Deutsche Stoppwortliste fuer die Begriffshaeufigkeits-Analyse (Sekundaersignal).
STOPWORDS: set[str] = {
    w.lower()
    for w in """
    der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner keines
    dieser diese dieses diesen diesem jeder jede jedes jedem jeden alle aller alles allem allen
    manche mancher manches
    ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen mein meine meiner meinen
    meinem dein deine deiner deinen deinem sein seine seiner seinen seinem unser unsere unserer
    euer eure man wer was wen wem wessen jemand niemand etwas nichts
    und oder aber doch denn weil dass wenn als wie ob sondern sowie also damit obwohl
    waehrend bis bevor nachdem sofern indem
    in an auf fuer von mit bei nach aus zu ueber unter vor durch gegen ohne um zwischen
    seit ab gegenueber innerhalb ausserhalb trotz wegen
    ist sind war waren bin bist seid sei gewesen hat habe hast habt haben hatte
    hatten wird werde wirst werdet werden wurde wurden kann kannst koennen konnte
    konnten muss musst muessen musste mussten soll sollst sollen sollte sollten
    will willst wollen wollte wollten mag magst moegen moechte moechten darf darfst
    duerfen durfte gibt geht kommt macht machen gemacht
    nicht auch noch schon nur mal ja nein doch hier da dann also so sehr mehr viel
    viele wenig wenige wie was wer wo wohin woher warum wieso weshalb immer nie
    niemals manchmal wieder gerade gerne eigentlich einfach genau halt echt wirklich
    vielleicht sicher natuerlich bald jetzt heute morgen gestern bereits sogar selbst
    ganz gar ziemlich etwa ungefaehr
    lol xd haha hahaha jo joa ok okay kk achso ah oh achja ne jup jap nope alter digger
    boah huch
    eins zwei drei vier fuenf uhr medien ausgeschlossen
    """.split()
}


def score_message(text: str, is_poll: bool) -> tuple[int, dict[str, int]]:
    """Berechnet den Relevanz-Score einer Nachricht.

    Rueckgabe: (Gesamt-Score, {Kategorie: Trefferanzahl (gedeckelt)})
    """
    hits_by_category: dict[str, int] = {}
    total = 0
    for cat, patterns in CATEGORY_PATTERNS.items():
        hits = sum(1 for p in patterns if p.search(text))
        hits = min(hits, MAX_HITS_PER_CATEGORY)
        if hits:
            hits_by_category[cat] = hits
            total += hits * CATEGORY_WEIGHTS[cat]
    if is_poll:
        total += POLL_BONUS
    return total, hits_by_category
