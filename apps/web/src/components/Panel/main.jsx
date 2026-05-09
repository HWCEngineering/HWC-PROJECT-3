import './panel.css';
import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaChevronLeft, FaXmark } from 'react-icons/fa6';

import { HiDownload } from "react-icons/hi";
import { BsFillTrash3Fill } from "react-icons/bs";
import { VscClearAll } from "react-icons/vsc";
import { VscListSelection } from "react-icons/vsc";

{/* Filters Section */}
{/* Upload Section */}
{/* Exports Section */}
{/* Photo Section ? */}

export function HWCPanel({ hwcViewer, cesiumViewer, isOpen, onToggle }) {
  const [expandedSections, setExpandedSections] = useState({
    tools: true,
    appearance: false,
    camera: false,
    scene: false,
    export: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen) {
    return (
      <button 
        className="hwc-panel-toggle collapsed"
        onClick={onToggle}
        aria-label="Open tools panel"
        title="Open Tools"
      >
        <FaChevronLeft />
      </button>
    );
  }

  return (
    <div className="hwc-panel">
      <div className="hwc-panel-header">
        <h3>Point Cloud Tools</h3>
        <button 
          className="hwc-panel-close"
          onClick={onToggle}
          aria-label="Close panel"
        >
          <FaXmark />
        </button>
      </div>

      <div className="hwc-panel-content">
        {/* Tools Section */}
        <PanelSection
          title="Tools"
          iconPath="distance"
          isExpanded={expandedSections.tools}
          onToggle={() => toggleSection('tools')}
        >
          <ToolsSection hwcViewer={hwcViewer} />
        </PanelSection>

        {/* Appearance Section */}
        <PanelSection
          title="Appearance"
          iconPath="eye"
          isExpanded={expandedSections.appearance}
          onToggle={() => toggleSection('appearance')}
        >
          <AppearanceSection hwcViewer={hwcViewer} />
        </PanelSection>

        {/* Camera Section */}
        <PanelSection
          title="Camera"
          iconPath="perspective-camera"
          isExpanded={expandedSections.camera}
          onToggle={() => toggleSection('camera')}
        >
          <CameraSection hwcViewer={hwcViewer} />
        </PanelSection>

        {/* Scene Section */}
        <PanelSection
          title="Scene"
          iconPath="cloud"
          isExpanded={expandedSections.scene}
          onToggle={() => toggleSection('scene')}
        >
          <SceneSection hwcViewer={hwcViewer} />
        </PanelSection>

        {/* Export Section */}
        <PanelSection
          title="Export & Share"
          iconPath="picture"
          isExpanded={expandedSections.export}
          onToggle={() => toggleSection('export')}
        >
          <ExportSection hwcViewer={hwcViewer} cesiumViewer={cesiumViewer} />
        </PanelSection>
      </div>
    </div>
  );
}

function PanelSection({ title, iconPath, isExpanded, onToggle, children }) {
  return (
    <div className="panel-section">
      <button 
        className="panel-section-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="panel-section-title">
          <img 
            src={`/hwc/1.8.2/build/hwc/resources/icons/${iconPath}.svg`}
            alt={title}
            className="panel-section-icon"
          />
          <span>{title}</span>
        </div>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      
      {isExpanded && (
        <div className="panel-section-content">
          {children}
        </div>
      )}
    </div>
  );
}