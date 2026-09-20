using System;
using System.Collections.Generic;
using Vexforge.Backend;

namespace Vexforge.Tier1
{
    public sealed class VexforgeTier1StrategyDirector
    {
        public string BuildPreMatchReadout(CardRecord[] catalog, DeckSlot[] deck, string opponentName, int opponentMmr, int opponentDeckSize)
        {
            var nonEmpty=0;var totalPower=0;var factions=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if(deck!=null)foreach(var slot in deck){if(slot==null)continue;nonEmpty++;totalPower+=slot.power;if(!string.IsNullOrWhiteSpace(slot.faction))factions.Add(slot.faction);}
            if(nonEmpty==0)return "FORJA SIN FORMACIÓN · no se inventa una recomendación sin datos del deck.";
            var shape=factions.Count<=1?"MONO-FACCIÓN":factions.Count==2?"HÍBRIDA":"DIVERSA";
            var avg=totalPower/nonEmpty;
            var name=string.IsNullOrWhiteSpace(opponentName)?"RIVAL DEL NEXUS":opponentName.ToUpperInvariant();
            return name+"\nMMR "+(opponentMmr>0?opponentMmr.ToString():"REPORTADO")+" · DECK "+(opponentDeckSize>0?opponentDeckSize.ToString():"REPORTADO")+"\n\nTU FORMACIÓN · "+shape+" · PODER MEDIO "+avg+"\n\nLECTURA DE COUNTER · NO REPORTADA\nLa composición oculta del rival nunca se infiere ni se fabrica en el cliente.";
        }

        public string BuildPostMatchInsight(BattleResult result)
        {
            if(result==null)return "SIN RESULTADO AUTORIZADO.";
            var attacks=0;var damage=0;var guards=0;var shields=0;var defeats=0;
            foreach(var e in result.events??new BattleEvent[0]){if(e==null)continue;var k=(e.event_type??string.Empty).ToUpperInvariant();if(k.Contains("ATTACK")||k.Contains("STRIKE"))attacks++;if(k.Contains("DAMAGE"))damage+=Math.Max(0,e.amount);if(k.Contains("GUARD"))guards++;if(k.Contains("SHIELD")||k.Contains("VEIL"))shields++;if(k.Contains("DEFEAT"))defeats++;}
            return (result.you_won?"VICTORIA":"DERROTA")+" · "+result.total_turns+" RONDAS\nOFENSIVAS "+attacks+" · DAÑO "+damage+" · GUARD "+guards+" · PROTECCIONES "+shields+" · BAJAS "+defeats+"\n\nLa lectura es descriptiva. No modifica reglas, MMR, recompensas ni economía.";
        }
    }
}
