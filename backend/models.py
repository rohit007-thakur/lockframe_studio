import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, default="Untitled Project")
    mode = Column(String(32), nullable=False, default="2d") # "2d" or "multiview"
    character_metadata = Column(Text, nullable=True) # JSON string of palette, style sheet, costume details
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    assets = relationship("Asset", back_populates="project", cascade="all, delete-orphan")
    revisions = relationship("EditRevision", back_populates="project", cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    view_type = Column(String(32), nullable=False, default="default_2d") # "front", "three_quarter", "side", "back", "default_2d"
    immutable_original_path = Column(String(512), nullable=False)
    current_image_path = Column(String(512), nullable=False)
    width = Column(Integer, default=1024)
    height = Column(Integer, default=1024)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="assets")
    revisions = relationship("EditRevision", back_populates="asset", cascade="all, delete-orphan")

class EditRevision(Base):
    __tablename__ = "edit_revisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    asset_id = Column(String(36), ForeignKey("assets.id"), nullable=False)
    parent_revision_id = Column(String(36), nullable=True)
    edit_mode = Column(String(64), nullable=False) # "pen_lock_inpaint", "vector_rerender", "multiview_sync"
    prompt = Column(Text, nullable=True)
    mask_path = Column(String(512), nullable=True)
    result_image_path = Column(String(512), nullable=False)
    model_settings = Column(Text, nullable=True) # JSON serialized settings (seed, steps, denoise)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)

    project = relationship("Project", back_populates="revisions")
    asset = relationship("Asset", back_populates="revisions")
    receipt = relationship("LockReceipt", back_populates="revision", uselist=False, cascade="all, delete-orphan")

class LockReceipt(Base):
    __tablename__ = "lock_receipts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    revision_id = Column(String(36), ForeignKey("edit_revisions.id"), nullable=False)
    asset_id = Column(String(36), nullable=False)
    outside_changed_pixels = Column(Integer, nullable=False, default=0)
    outside_drift_percentage = Column(Float, nullable=False, default=0.0)
    is_verified = Column(Boolean, nullable=False, default=True)
    heatmap_path = Column(String(512), nullable=False)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)
    audit_metadata = Column(Text, nullable=True) # JSON string of verification hash, bounds, mask stats

    revision = relationship("EditRevision", back_populates="receipt")
