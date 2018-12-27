import defaultsDeep from 'lodash/defaultsDeep'
import forEach from 'lodash/forEach'
import isArray from 'lodash/isArray'
import map from 'lodash/map'
import Layout from './layout/index'
import render from './render'
import Text from './tracks/Text'
import Highlight from './tracks/Highlight'
import Histogram from './tracks/Histogram'
import Chords from './tracks/Chords'
import Heatmap from './tracks/Heatmap'
import Line from './tracks/Line'
import Scatter from './tracks/Scatter'
import Stack from './tracks/Stack'
import {initClipboard} from './clipboard'
import * as d3 from 'd3';

const defaultConf = {
  width: 700,
  height: 700,
  container: 'circos',
  defaultTrackWidth: 10
}

const zoom = d3.zoom().scaleExtent([1,2]).on("zoom", function() {
  d3.select('.all').attr("transform", d3.event.transform)
});


function download_svg(){
  if (document.getElementById('svg-child').hasChildNodes() === true) {
    const circos_svg = document.getElementById('svg-child');
    const svg_as_xml = (new XMLSerializer).serializeToString(circos_svg);
    const svg_data = `data:image/svg+xml,${encodeURIComponent(svg_as_xml)}`
    const link = document.getElementById('download-link') 
    link.setAttribute("href", svg_data);
    link.setAttribute("download", "circos.svg");
    link.click();
  }
}

class Core {
  constructor (conf) {
    this.tracks = {}
    this._layout = null
    this.conf = defaultsDeep(conf, defaultConf)

    // Apply style for positioning button
    const container = d3.select(this.conf.container).style('position', 'relative');
    this.svg = container.append('svg')
    console.warn('this.conf', this.conf)
    console.warn('conf', conf)
    if (conf.enableZoomPan === true) {
    // Apply zoom & pan handler
      this.svg.attr('id', 'svg-child').call(zoom)
      this.svg.call(zoom.transform, d3.zoomIdentity.translate(conf.width/2, conf.height/2));

      // Reset to center on dbl click
      this.svg.on('dblclick.zoom', function(){d3.select('#svg-child').call(zoom.transform, d3.zoomIdentity.translate(conf.width/2, conf.height/2));})
    }

    if (conf.enableDownloadSVG === true) {
    // Add svg download button
    const button_svg = d3.select('#' + this.conf.container.id).append("button")
      .style('position', 'absolute')
      .style('top', '5%')
      .style('right', '5%')
      .text("Download SVG")
      .attr("id", "button")
      .classed("Button", true)
      .on("click.button", function() {download_svg()})
        .append('a')
        .attr('id', 'download-link')
    }

    
    if (d3.select('body').select('.circos-tooltip').empty()) {
      this.tip = d3.select('body').append('div')
      .attr('class', 'circos-tooltip')
      .attr('position', 'fixed')
      .style('opacity', 0)
    } else {
      this.tip = d3.select('body').select('.circos-tooltip')
    }

    this.clipboard = initClipboard(this.conf.container)
  }
  
  removeToolTip() {
    this.tip.remove()
  }

  removeTracks (trackIds) {
    if (typeof (trackIds) === 'undefined') {
      map(this.tracks, (track, id) => {
        this.svg.select('.' + id).remove()
      })
      this.tracks = {}
    } else if (typeof (trackIds) === 'string') {
      this.svg.select('.' + trackIds).remove()
      delete this.tracks[trackIds]
    } else if (isArray(trackIds)) {
      forEach(trackIds, function (trackId) {
        this.svg.select('.' + trackId).remove()
        delete this.tracks[trackId]
      })
    } else {
      console.warn('removeTracks received an unhandled attribute type')
    }

    return this
  }

  layout (data, conf) {
    this._layout = new Layout(conf, data)
    return this
  }

  chords (id, data, conf) {
    this.tracks[id] = new Chords(this, conf, data)
    return this
  }
  heatmap (id, data, conf) {
    this.tracks[id] = new Heatmap(this, conf, data)
    return this
  }
  highlight (id, data, conf) {
    this.tracks[id] = new Highlight(this, conf, data)
    return this
  }
  histogram (id, data, conf) {
    this.tracks[id] = new Histogram(this, conf, data)
    return this
  }
  line (id, data, conf) {
    this.tracks[id] = new Line(this, conf, data)
    return this
  }
  scatter (id, data, conf) {
    this.tracks[id] = new Scatter(this, conf, data)
    return this
  }
  stack (id, data, conf) {
    this.tracks[id] = new Stack(this, conf, data)
    return this
  }
  text (id, data, conf) {
    this.tracks[id] = new Text(this, conf, data)
    return this
  }
  render (ids, removeTracks) {
    render(ids, removeTracks, this)
  }
}


const Circos = (conf) => {
  const instance = new Core(conf)
  return instance
}

module.exports = Circos
